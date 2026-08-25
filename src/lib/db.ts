import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.DATABASE_PATH 
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(DB_DIR, 'steam_family.db');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

let dbInstance: DatabaseSync | null = null;
let isInitialized = false;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA busy_timeout = 10000;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA synchronous = NORMAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
  }

  if (!isInitialized) {
    initDb(dbInstance);
    isInitialized = true;
  }

  return dbInstance;
}

// Export lazy getter proxy for db
export const db = new Proxy({} as DatabaseSync, {
  get(_target, prop: keyof DatabaseSync) {
    const instance = getDb();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

function initDb(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      steam_id TEXT PRIMARY KEY,
      persona_name TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      profile_url TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 1,
      is_submitted INTEGER NOT NULL DEFAULT 1,
      total_games INTEGER NOT NULL DEFAULT 0,
      shareable_games INTEGER NOT NULL DEFAULT 0,
      scan_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      last_scanned_at TEXT
    );

    CREATE TABLE IF NOT EXISTS games (
      app_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      header_image TEXT,
      is_family_shareable INTEGER,
      genres TEXT,
      categories TEXT,
      checked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS account_games (
      steam_id TEXT NOT NULL,
      app_id INTEGER NOT NULL,
      playtime_forever INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (steam_id, app_id),
      FOREIGN KEY (steam_id) REFERENCES accounts(steam_id) ON DELETE CASCADE,
      FOREIGN KEY (app_id) REFERENCES games(app_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      voter_steam_id TEXT NOT NULL,
      app_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (voter_steam_id, app_id),
      FOREIGN KEY (app_id) REFERENCES games(app_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scan_queue (
      app_id INTEGER PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      retries INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      added_at TEXT NOT NULL,
      processed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_games_shareable ON games(is_family_shareable);
    CREATE INDEX IF NOT EXISTS idx_account_games_steam ON account_games(steam_id);
    CREATE INDEX IF NOT EXISTS idx_account_games_app ON account_games(app_id);
    CREATE INDEX IF NOT EXISTS idx_user_prefs_voter ON user_preferences(voter_steam_id);
    CREATE INDEX IF NOT EXISTS idx_scan_queue_status ON scan_queue(status);
  `);

  // Set default phase
  const stmt = database.prepare('SELECT value FROM system_settings WHERE key = ?');
  const row = stmt.get('phase') as { value: string } | undefined;
  if (!row) {
    database.prepare("INSERT INTO system_settings (key, value) VALUES ('phase', 'registration')").run();
  }
}

export function getSetting(key: string, defaultValue: string = ''): string {
  const stmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

export function setSetting(key: string, value: string) {
  const stmt = db.prepare(`
    INSERT INTO system_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run(key, value);
}

export type PhaseType = 'registration' | 'voting' | 'completed';

export function getSystemPhase(): PhaseType {
  return (getSetting('phase', 'registration') as PhaseType) || 'registration';
}

export function setSystemPhase(phase: PhaseType) {
  setSetting('phase', phase);
}
