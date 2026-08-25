import { db } from './db';
import { fetchAppDetails } from './steam';

// Rate limit delay in milliseconds between Store API requests (1.2s = 50 req/min, safe limit)
const REQUEST_DELAY_MS = 1200;
const RATE_LIMIT_BACKOFF_MS = 20000; // 20s backoff on 429
const MAX_RETRIES = 5; // Give up on an app after this many retries

let isWorkerRunning = false;

export interface QueueStatus {
  total: number;
  pending: number;
  processing: number;
  done: number;
  failed: number;
  estimatedTimeSeconds: number;
  isRunning: boolean;
}

export function getQueueStatus(): QueueStatus {
  const counts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM scan_queue
  `).get() as { total: number; pending: number | null; processing: number | null; done: number | null; failed: number | null };

  const total = counts.total || 0;
  const pending = counts.pending || 0;
  const processing = counts.processing || 0;
  const done = counts.done || 0;
  const failed = counts.failed || 0;

  const remaining = pending + processing;
  const estimatedTimeSeconds = Math.ceil((remaining * REQUEST_DELAY_MS) / 1000);

  // Automatically ensure worker is running if items remain
  if (remaining > 0 && !isWorkerRunning) {
    startQueueWorker();
  }

  return {
    total,
    pending,
    processing,
    done,
    failed,
    estimatedTimeSeconds,
    isRunning: isWorkerRunning,
  };
}

export function queueAppIds(appIds: number[]) {
  const insertQueue = db.prepare(`
    INSERT OR IGNORE INTO scan_queue (app_id, status, added_at)
    VALUES (?, 'pending', datetime('now'))
  `);

  // Only queue apps that have NOT been checked yet in games table
  const checkGame = db.prepare(`
    SELECT is_family_shareable FROM games WHERE app_id = ?
  `);

  for (const appId of appIds) {
    const existing = checkGame.get(appId) as { is_family_shareable: number | null } | undefined;
    if (!existing || existing.is_family_shareable === null) {
      insertQueue.run(appId);
    }
  }

  // Automatically start worker if not already running
  startQueueWorker();
}

export function startQueueWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  // Reset any orphaned 'processing' states from previous server crashes/restarts back to 'pending'
  try {
    db.prepare(`
      UPDATE scan_queue 
      SET status = 'pending' 
      WHERE status = 'processing'
    `).run();
  } catch (e) {
    console.error('Error resetting orphaned queue items:', e);
  }

  processQueue().catch((err) => {
    console.error('Queue worker crashed:', err);
    isWorkerRunning = false;
  });
}

async function processQueue() {
  while (true) {
    // Find next pending item
    const item = db.prepare(`
      SELECT app_id, retries FROM scan_queue 
      WHERE status = 'pending' 
      ORDER BY added_at ASC 
      LIMIT 1
    `).get() as { app_id: number; retries: number } | undefined;

    if (!item) {
      // Nothing pending - update accounts scan statuses and stop worker
      updateAccountsScanStatus();
      isWorkerRunning = false;
      break;
    }

    const appId = item.app_id;

    // Mark as processing
    db.prepare(`
      UPDATE scan_queue 
      SET status = 'processing' 
      WHERE app_id = ?
    `).run(appId);

    // Fetch app details
    const details = await fetchAppDetails(appId);

    if (details === null) {
      // Likely rate limited or network error
      if (item.retries >= MAX_RETRIES) {
        console.error(`[Queue] App ${appId} exceeded max retries (${MAX_RETRIES}). Marking as failed.`);
        db.prepare(`
          UPDATE scan_queue 
          SET status = 'failed', error_message = 'Max retries exceeded', processed_at = datetime('now')
          WHERE app_id = ?
        `).run(appId);
        continue;
      }

      console.warn(`[Queue] Rate limit or error on app ${appId} (retry ${item.retries + 1}/${MAX_RETRIES}). Backing off for ${RATE_LIMIT_BACKOFF_MS / 1000}s...`);
      db.prepare(`
        UPDATE scan_queue 
        SET status = 'pending', retries = retries + 1 
        WHERE app_id = ?
      `).run(appId);

      await new Promise((r) => setTimeout(r, RATE_LIMIT_BACKOFF_MS));
      continue;
    }

    // Update games database
    db.prepare(`
      INSERT INTO games (app_id, name, header_image, is_family_shareable, genres, categories, checked_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(app_id) DO UPDATE SET
        name = CASE WHEN excluded.name != '' AND excluded.name NOT LIKE 'App %' THEN excluded.name ELSE games.name END,
        header_image = CASE WHEN excluded.header_image != '' THEN excluded.header_image ELSE games.header_image END,
        is_family_shareable = excluded.is_family_shareable,
        genres = excluded.genres,
        categories = excluded.categories,
        checked_at = excluded.checked_at
    `).run(
      details.appId,
      details.name,
      details.headerImage,
      details.isFamilyShareable ? 1 : 0,
      JSON.stringify(details.genres),
      JSON.stringify(details.categories)
    );

    // Mark queue item as done
    db.prepare(`
      UPDATE scan_queue 
      SET status = 'done', processed_at = datetime('now') 
      WHERE app_id = ?
    `).run(appId);

    // Update shareable count only for accounts that own this specific game
    db.prepare(`
      UPDATE accounts 
      SET shareable_games = (
        SELECT COUNT(DISTINCT ag.app_id) 
        FROM account_games ag
        JOIN games g ON ag.app_id = g.app_id
        WHERE ag.steam_id = accounts.steam_id AND g.is_family_shareable = 1
      )
      WHERE steam_id IN (SELECT steam_id FROM account_games WHERE app_id = ?)
    `).run(appId);

    // Respect Steam Store API rate limit
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }
}

export function updateAccountsScanStatus() {
  const accounts = db.prepare('SELECT steam_id FROM accounts').all() as Array<{ steam_id: string }>;

  for (const acc of accounts) {
    const pendingGames = db.prepare(`
      SELECT COUNT(*) as count 
      FROM account_games ag
      JOIN scan_queue sq ON ag.app_id = sq.app_id
      WHERE ag.steam_id = ? AND sq.status IN ('pending', 'processing')
    `).get(acc.steam_id) as { count: number };

    const status = (pendingGames.count === 0) ? 'completed' : 'scanning';
    
    db.prepare(`
      UPDATE accounts 
      SET scan_status = ?, last_scanned_at = datetime('now') 
      WHERE steam_id = ?
    `).run(status, acc.steam_id);
  }
}
