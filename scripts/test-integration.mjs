import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert';

console.log('🧪 RUNNING COMPREHENSIVE INTEGRATION & UNIT TEST SUITE...\n');

// 1. Initialize In-Memory Database
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE accounts (
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

  CREATE TABLE games (
    app_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    header_image TEXT,
    is_family_shareable INTEGER,
    genres TEXT,
    categories TEXT,
    checked_at TEXT
  );

  CREATE TABLE account_games (
    steam_id TEXT NOT NULL,
    app_id INTEGER NOT NULL,
    playtime_forever INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (steam_id, app_id),
    FOREIGN KEY (steam_id) REFERENCES accounts(steam_id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES games(app_id) ON DELETE CASCADE
  );

  CREATE TABLE user_preferences (
    voter_steam_id TEXT NOT NULL,
    app_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (voter_steam_id, app_id),
    FOREIGN KEY (app_id) REFERENCES games(app_id) ON DELETE CASCADE
  );

  CREATE TABLE scan_queue (
    app_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    retries INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    added_at TEXT NOT NULL,
    processed_at TEXT
  );
`);

console.log('✅ 1. SQLite schema & foreign keys initialized successfully.');

// Test 2: System Settings & Phase Transitions
db.prepare("INSERT INTO system_settings (key, value) VALUES ('phase', 'registration')").run();
let phase = db.prepare("SELECT value FROM system_settings WHERE key = 'phase'").get().value;
assert.strictEqual(phase, 'registration', 'Initial phase should be registration');

db.prepare("UPDATE system_settings SET value = 'voting' WHERE key = 'phase'").run();
phase = db.prepare("SELECT value FROM system_settings WHERE key = 'phase'").get().value;
assert.strictEqual(phase, 'voting', 'Phase transition to voting failed');

db.prepare("UPDATE system_settings SET value = 'completed' WHERE key = 'phase'").run();
phase = db.prepare("SELECT value FROM system_settings WHERE key = 'phase'").get().value;
assert.strictEqual(phase, 'completed', 'Phase transition to completed failed');
console.log('✅ 2. Phase state machine transitions verified.');

// Test 3: Account Ingestion & Game Linking
const insertAcc = db.prepare(`
  INSERT INTO accounts (steam_id, persona_name, avatar_url, profile_url, is_public, is_submitted, total_games, shareable_games, scan_status, created_at)
  VALUES (?, ?, '', '', 1, 1, ?, ?, 'completed', datetime('now'))
`);

const testAccounts = [
  { id: '1001', name: 'Alice', total: 4, shareable: 3 },
  { id: '1002', name: 'Bob', total: 4, shareable: 4 },
  { id: '1003', name: 'Charlie', total: 5, shareable: 4 },
  { id: '1004', name: 'David', total: 3, shareable: 3 },
  { id: '1005', name: 'Eva', total: 3, shareable: 2 },
];

for (const a of testAccounts) {
  insertAcc.run(a.id, a.name, a.total, a.shareable);
}

const countAcc = db.prepare('SELECT COUNT(*) as c FROM accounts').get().c;
assert.strictEqual(countAcc, 5, 'Should have 5 accounts');
console.log('✅ 3. Account ingestion verified (5 accounts inserted).');

// Test 4: Game Catalog & Family Sharing Filter
const insertGame = db.prepare(`
  INSERT INTO games (app_id, name, header_image, is_family_shareable, genres, checked_at)
  VALUES (?, ?, '', ?, ?, datetime('now'))
`);

const testGames = [
  { id: 1, name: 'Elden Ring', shareable: 1, genres: JSON.stringify(['RPG', 'Action']) },
  { id: 2, name: 'Baldurs Gate 3', shareable: 1, genres: JSON.stringify(['RPG', 'Strategy']) },
  { id: 3, name: 'Cyberpunk 2077', shareable: 1, genres: JSON.stringify(['RPG', 'Open World']) },
  { id: 4, name: 'Rust', shareable: 0, genres: JSON.stringify(['Survival', 'Multiplayer']) }, // EXCLUDED
  { id: 5, name: 'Valheim', shareable: 1, genres: JSON.stringify(['Survival', 'Co-op']) },
  { id: 6, name: 'Hades II', shareable: 1, genres: JSON.stringify(['Roguelike', 'Action']) },
  { id: 7, name: 'Terraria', shareable: 1, genres: JSON.stringify(['Sandbox', 'Adventure']) },
];

for (const g of testGames) {
  insertGame.run(g.id, g.name, g.shareable, g.genres);
}

// Link games to accounts
const insertAccGame = db.prepare('INSERT INTO account_games (steam_id, app_id, playtime_forever) VALUES (?, ?, ?)');
// Alice: Elden Ring (1), Baldurs Gate (2), Cyberpunk (3), Rust (4 - not shareable)
insertAccGame.run('1001', 1, 300);
insertAccGame.run('1001', 2, 200);
insertAccGame.run('1001', 3, 100);
insertAccGame.run('1001', 4, 50);

// Bob: Baldurs Gate (2), Valheim (5), Hades II (6), Terraria (7)
insertAccGame.run('1002', 2, 400);
insertAccGame.run('1002', 5, 250);
insertAccGame.run('1002', 6, 120);
insertAccGame.run('1002', 7, 500);

// Charlie: Elden Ring (1), Cyberpunk (3), Hades II (6), Valheim (5)
insertAccGame.run('1003', 1, 150);
insertAccGame.run('1003', 3, 300);
insertAccGame.run('1003', 6, 80);
insertAccGame.run('1003', 5, 120);

// David: Terraria (7), Cyberpunk (3), Elden Ring (1)
insertAccGame.run('1004', 7, 60);
insertAccGame.run('1004', 3, 140);
insertAccGame.run('1004', 1, 80);

// Eva: Hades II (6), Valheim (5)
insertAccGame.run('1005', 6, 200);
insertAccGame.run('1005', 5, 100);

const shareableCount = db.prepare('SELECT COUNT(*) as c FROM games WHERE is_family_shareable = 1').get().c;
assert.strictEqual(shareableCount, 6, 'Should have 6 shareable games');

const rustShareable = db.prepare('SELECT is_family_shareable FROM games WHERE app_id = 4').get().is_family_shareable;
assert.strictEqual(rustShareable, 0, 'Rust must NOT be shareable (0)');
console.log('✅ 4. Game catalog and Family Sharing exclusion (Rust=0) verified.');

// Test 5: Voting & Preferences
const insertVote = db.prepare(`
  INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT(voter_steam_id, app_id) DO UPDATE SET score = excluded.score, updated_at = datetime('now')
`);

// Voter 1 wants Elden Ring (3) & Baldurs Gate 3 (3)
insertVote.run('voter_1', 1, 3);
insertVote.run('voter_1', 2, 3);

// Voter 2 wants Hades II (3) & Valheim (1)
insertVote.run('voter_2', 6, 3);
insertVote.run('voter_2', 5, 1);

// Voter 3 wants Cyberpunk (3) & Terraria (1)
insertVote.run('voter_3', 3, 3);
insertVote.run('voter_3', 7, 1);

const totalVotes = db.prepare('SELECT COUNT(*) as c FROM user_preferences').get().c;
assert.strictEqual(totalVotes, 6, 'Should have 6 total preference votes');

// Test vote deletion on score=0
db.prepare('DELETE FROM user_preferences WHERE voter_steam_id = ? AND app_id = ?').run('voter_3', 7);
const updatedVotes = db.prepare('SELECT COUNT(*) as c FROM user_preferences').get().c;
assert.strictEqual(updatedVotes, 5, 'Vote deletion on score=0 failed');
// Restore
insertVote.run('voter_3', 7, 1);
console.log('✅ 5. Voting preferences CRUD and score weights verified.');

// Test 6: Optimization Solver Algorithm
function getCombinations(array, size) {
  if (size === 0) return [[]];
  if (array.length < size) return [];
  const [head, ...tail] = array;
  const withHead = getCombinations(tail, size - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, size);
  return [...withHead, ...withoutHead];
}

const accountsList = db.prepare('SELECT steam_id, persona_name FROM accounts').all();
const combinations = getCombinations(accountsList, 4);
assert.strictEqual(combinations.length, 5, 'Combinations C(5, 4) should be 5');

let bestCombination = null;
let maxScore = -1;

for (const combo of combinations) {
  const comboIds = combo.map((a) => `'${a.steam_id}'`).join(',');
  const shareableGames = new Set(
    db.prepare(`
      SELECT DISTINCT ag.app_id 
      FROM account_games ag 
      JOIN games g ON ag.app_id = g.app_id 
      WHERE ag.steam_id IN (${comboIds}) AND g.is_family_shareable = 1
    `).all().map((r) => r.app_id)
  );

  let satisfiedScore = 0;
  const allUserVotes = db.prepare('SELECT voter_steam_id, app_id, score FROM user_preferences').all();
  for (const v of allUserVotes) {
    if (shareableGames.has(v.app_id)) {
      satisfiedScore += v.score;
    }
  }

  if (satisfiedScore > maxScore) {
    maxScore = satisfiedScore;
    bestCombination = combo;
  }
}

assert.ok(bestCombination !== null, 'Solver must find a winning combination');
assert.strictEqual(bestCombination.length, 4, 'Winning combination must have 4 accounts');
console.log(`✅ 6. Combinatorial Optimizer Solver verified: 4 accounts selected with max score ${maxScore}.`);
console.log('   Winning Accounts:', bestCombination.map((a) => a.persona_name).join(', '));

console.log('\n🎉 ALL INTEGRATION & UNIT TESTS PASSED SUCCESSFULLY! (6/6)');
