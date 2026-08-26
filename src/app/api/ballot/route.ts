import { NextRequest, NextResponse } from 'next/server';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ hasSubmittedBallot: false, submittedAt: null });
  }

  const row = db.prepare('SELECT submitted_at FROM ballot_submissions WHERE voter_steam_id = ?').get(session.steamId) as { submitted_at: string } | undefined;

  return NextResponse.json({
    hasSubmittedBallot: !!row,
    submittedAt: row ? row.submitted_at : null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Zaloguj się przez Steam, aby zatwierdzić głosy' }, { status: 401 });
  }

  const phase = getSystemPhase();
  if (phase !== 'voting') {
    return NextResponse.json({ error: 'Głosowanie jest obecnie zablokowane' }, { status: 400 });
  }

  // Security check: Only accounts registered in Phase 1 can participate
  const account = db.prepare('SELECT is_submitted FROM accounts WHERE steam_id = ?').get(session.steamId) as { is_submitted: number } | undefined;
  if (!account || account.is_submitted !== 1) {
    return NextResponse.json({ error: 'Tylko konta zgłoszone w Fazie 1 mogą brać udział w głosowaniu' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { gameVotes, accountPreferences } = body as {
      gameVotes?: Record<number, number>; // appId -> score (3 or 1)
      accountPreferences?: Array<{ targetSteamId: string; tier: number; rankOrder: number }>;
    };

    const voterSteamId = session.steamId;

    // Transactional write: All or nothing
    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Clear old game preferences and write new ones
      db.prepare('DELETE FROM user_preferences WHERE voter_steam_id = ?').run(voterSteamId);
      if (gameVotes && typeof gameVotes === 'object') {
        const insertGameVote = db.prepare(`
          INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at)
          VALUES (?, ?, ?, datetime('now'))
        `);
        for (const [appIdStr, score] of Object.entries(gameVotes)) {
          const appId = Number(appIdStr);
          if (appId > 0 && [1, 3].includes(score)) {
            insertGameVote.run(voterSteamId, appId, score);
          }
        }
      }

      // 2. Clear old account preferences and write new ones
      db.prepare('DELETE FROM account_preferences WHERE voter_steam_id = ?').run(voterSteamId);
      if (Array.isArray(accountPreferences)) {
        const insertAccPref = db.prepare(`
          INSERT INTO account_preferences (voter_steam_id, target_steam_id, tier, rank_order, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `);
        for (const p of accountPreferences) {
          if (typeof p.targetSteamId === 'string' && p.targetSteamId !== voterSteamId && typeof p.tier === 'number') {
            insertAccPref.run(voterSteamId, p.targetSteamId, p.tier, p.rankOrder || 0);
          }
        }
      }

      // 3. Register official ballot submission
      db.prepare(`
        INSERT INTO ballot_submissions (voter_steam_id, submitted_at)
        VALUES (?, datetime('now'))
        ON CONFLICT(voter_steam_id) DO UPDATE SET submitted_at = datetime('now')
      `).run(voterSteamId);

      db.exec('COMMIT;');

      return NextResponse.json({
        success: true,
        message: 'Twój oficjalny głos został pomyślnie zatwierdzony i zarejestrowany!',
        submittedAt: new Date().toISOString(),
      });
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }
  } catch (error) {
    console.error('Error submitting official ballot:', error);
    return NextResponse.json({ error: 'Błąd podczas zatwierdzania głosu' }, { status: 500 });
  }
}
