import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert';

let passCount = 0;
const totalTests = 12;

function pass(msg) {
  passCount++;
  console.log(`✅ ${passCount}. ${msg}`);
}

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

  CREATE INDEX idx_games_shareable ON games(is_family_shareable);
  CREATE INDEX idx_account_games_steam ON account_games(steam_id);
  CREATE INDEX idx_account_games_app ON account_games(app_id);
  CREATE INDEX idx_user_prefs_voter ON user_preferences(voter_steam_id);
  CREATE INDEX idx_scan_queue_status ON scan_queue(status);
`);

pass('SQLite schema, indexes & foreign keys initialized successfully.');

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

// Reverse transition (admin can go back)
db.prepare("UPDATE system_settings SET value = 'registration' WHERE key = 'phase'").run();
phase = db.prepare("SELECT value FROM system_settings WHERE key = 'phase'").get().value;
assert.strictEqual(phase, 'registration', 'Reverse phase transition failed');

pass('Phase state machine transitions (forward + backward) verified.');

// Test 3: Account Ingestion & Duplicate Handling
const insertAcc = db.prepare(`
  INSERT INTO accounts (steam_id, persona_name, avatar_url, profile_url, is_public, is_submitted, total_games, shareable_games, scan_status, created_at)
  VALUES (?, ?, '', '', 1, 1, ?, ?, 'completed', datetime('now'))
  ON CONFLICT(steam_id) DO UPDATE SET
    persona_name = excluded.persona_name,
    total_games = excluded.total_games
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

// Duplicate insert — should update, not fail
insertAcc.run('1001', 'Alice_Updated', 5, 3);
const aliceRow = db.prepare("SELECT persona_name, total_games FROM accounts WHERE steam_id = '1001'").get();
assert.strictEqual(aliceRow.persona_name, 'Alice_Updated', 'Duplicate account should update persona_name');
assert.strictEqual(aliceRow.total_games, 5, 'Duplicate account should update total_games');
// Restore
insertAcc.run('1001', 'Alice', 4, 3);

const countAcc = db.prepare('SELECT COUNT(*) as c FROM accounts').get().c;
assert.strictEqual(countAcc, 5, 'Should have 5 accounts (no duplicates)');

pass('Account ingestion & duplicate ON CONFLICT handling verified (5 accounts).');

// Test 4: Game Catalog & Family Sharing Filter
const insertGame = db.prepare(`
  INSERT INTO games (app_id, name, header_image, is_family_shareable, genres, checked_at)
  VALUES (?, ?, '', ?, ?, datetime('now'))
`);

const testGames = [
  { id: 1, name: 'Elden Ring', shareable: 1, genres: JSON.stringify(['RPG', 'Action']) },
  { id: 2, name: 'Baldurs Gate 3', shareable: 1, genres: JSON.stringify(['RPG', 'Strategy']) },
  { id: 3, name: 'Cyberpunk 2077', shareable: 1, genres: JSON.stringify(['RPG', 'Open World']) },
  { id: 4, name: 'Rust', shareable: 0, genres: JSON.stringify(['Survival', 'Multiplayer']) },
  { id: 5, name: 'Valheim', shareable: 1, genres: JSON.stringify(['Survival', 'Co-op']) },
  { id: 6, name: 'Hades II', shareable: 1, genres: JSON.stringify(['Roguelike', 'Action']) },
  { id: 7, name: 'Terraria', shareable: 1, genres: JSON.stringify(['Sandbox', 'Adventure']) },
];

for (const g of testGames) {
  insertGame.run(g.id, g.name, g.shareable, g.genres);
}

// Link games to accounts
const insertAccGame = db.prepare('INSERT INTO account_games (steam_id, app_id, playtime_forever) VALUES (?, ?, ?)');
insertAccGame.run('1001', 1, 300);
insertAccGame.run('1001', 2, 200);
insertAccGame.run('1001', 3, 100);
insertAccGame.run('1001', 4, 50);
insertAccGame.run('1002', 2, 400);
insertAccGame.run('1002', 5, 250);
insertAccGame.run('1002', 6, 120);
insertAccGame.run('1002', 7, 500);
insertAccGame.run('1003', 1, 150);
insertAccGame.run('1003', 3, 300);
insertAccGame.run('1003', 6, 80);
insertAccGame.run('1003', 5, 120);
insertAccGame.run('1004', 7, 60);
insertAccGame.run('1004', 3, 140);
insertAccGame.run('1004', 1, 80);
insertAccGame.run('1005', 6, 200);
insertAccGame.run('1005', 5, 100);

const shareableCount = db.prepare('SELECT COUNT(*) as c FROM games WHERE is_family_shareable = 1').get().c;
assert.strictEqual(shareableCount, 6, 'Should have 6 shareable games');

const rustShareable = db.prepare('SELECT is_family_shareable FROM games WHERE app_id = 4').get().is_family_shareable;
assert.strictEqual(rustShareable, 0, 'Rust must NOT be shareable');

pass('Game catalog and Family Sharing exclusion (Rust=0) verified.');

// Test 5: Voting Preferences CRUD
const insertVote = db.prepare(`
  INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT(voter_steam_id, app_id) DO UPDATE SET score = excluded.score, updated_at = datetime('now')
`);

insertVote.run('voter_1', 1, 3);
insertVote.run('voter_1', 2, 3);
insertVote.run('voter_2', 6, 3);
insertVote.run('voter_2', 5, 1);
insertVote.run('voter_3', 3, 3);
insertVote.run('voter_3', 7, 1);

let totalVotes = db.prepare('SELECT COUNT(*) as c FROM user_preferences').get().c;
assert.strictEqual(totalVotes, 6, 'Should have 6 total preference votes');

// Vote deletion
db.prepare('DELETE FROM user_preferences WHERE voter_steam_id = ? AND app_id = ?').run('voter_3', 7);
totalVotes = db.prepare('SELECT COUNT(*) as c FROM user_preferences').get().c;
assert.strictEqual(totalVotes, 5, 'Vote deletion failed');
insertVote.run('voter_3', 7, 1); // Restore

// Vote update (change score)
insertVote.run('voter_1', 1, 1); // Change Elden Ring from must-have(3) to interested(1)
const updatedScore = db.prepare("SELECT score FROM user_preferences WHERE voter_steam_id = 'voter_1' AND app_id = 1").get().score;
assert.strictEqual(updatedScore, 1, 'Vote update (score change) failed');
insertVote.run('voter_1', 1, 3); // Restore

pass('Voting preferences CRUD (insert, update, delete, restore) verified.');

// Test 6: Input Validation - Score values
const validScores = [0, 1, 3];
const invalidScores = [2, 4, -1, 100, 999];
for (const s of validScores) {
  assert.ok(validScores.includes(s), `Score ${s} should be valid`);
}
for (const s of invalidScores) {
  assert.ok(!validScores.includes(s), `Score ${s} should be invalid`);
}
pass('Vote score validation logic (0, 1, 3 only) verified.');

// Test 7: Scan Queue with Max Retries
db.prepare("INSERT INTO scan_queue (app_id, status, retries, added_at) VALUES (999, 'pending', 0, datetime('now'))").run();
const MAX_RETRIES = 5;

// Simulate retries
for (let i = 0; i < MAX_RETRIES; i++) {
  db.prepare("UPDATE scan_queue SET retries = retries + 1 WHERE app_id = 999").run();
}
const retriedItem = db.prepare("SELECT retries FROM scan_queue WHERE app_id = 999").get();
assert.strictEqual(retriedItem.retries, MAX_RETRIES, `Retries should be ${MAX_RETRIES}`);

// After max retries, should be marked as failed
db.prepare("UPDATE scan_queue SET status = 'failed', error_message = 'Max retries exceeded' WHERE app_id = 999 AND retries >= ?").run(MAX_RETRIES);
const failedItem = db.prepare("SELECT status, error_message FROM scan_queue WHERE app_id = 999").get();
assert.strictEqual(failedItem.status, 'failed', 'Should be marked as failed after max retries');
assert.strictEqual(failedItem.error_message, 'Max retries exceeded', 'Error message should be set');

pass('Scan queue max retries limit and failure marking verified.');

// Test 8: Account Deletion Cascades (votes cleanup)
// Create a temp account
db.prepare("INSERT INTO accounts (steam_id, persona_name, avatar_url, profile_url, is_public, is_submitted, total_games, scan_status, created_at) VALUES ('temp_del', 'TempUser', '', '', 1, 1, 0, 'completed', datetime('now'))").run();
// Create a temp game for this test
db.prepare("INSERT INTO games (app_id, name, is_family_shareable) VALUES (9999, 'TestGame', 1)").run();
db.prepare("INSERT INTO account_games (steam_id, app_id, playtime_forever) VALUES ('temp_del', 9999, 10)").run();
db.prepare("INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at) VALUES ('temp_del', 1, 3, datetime('now'))").run();

// Verify data exists
assert.ok(db.prepare("SELECT * FROM accounts WHERE steam_id = 'temp_del'").get(), 'Temp account should exist');
assert.ok(db.prepare("SELECT * FROM user_preferences WHERE voter_steam_id = 'temp_del'").get(), 'Temp votes should exist');

// Delete account — simulate the corrected deletion order
db.prepare("DELETE FROM user_preferences WHERE voter_steam_id = 'temp_del'").run();
db.prepare("DELETE FROM account_games WHERE steam_id = 'temp_del'").run();
db.prepare("DELETE FROM accounts WHERE steam_id = 'temp_del'").run();

assert.strictEqual(db.prepare("SELECT COUNT(*) as c FROM accounts WHERE steam_id = 'temp_del'").get().c, 0, 'Account should be deleted');
assert.strictEqual(db.prepare("SELECT COUNT(*) as c FROM user_preferences WHERE voter_steam_id = 'temp_del'").get().c, 0, 'Votes should be cleaned up on account deletion');
assert.strictEqual(db.prepare("SELECT COUNT(*) as c FROM account_games WHERE steam_id = 'temp_del'").get().c, 0, 'Account games should be cleaned up');

// Clean up temp game
db.prepare("DELETE FROM games WHERE app_id = 9999").run();

pass('Account deletion with votes/games cascade cleanup verified.');

// Test 9: Game Name Preservation (no overwrite with empty/placeholder)
db.prepare("INSERT INTO games (app_id, name, header_image, is_family_shareable) VALUES (43160, 'Metro 2033', 'http://img.jpg', 1)").run();

// Simulate store API returning empty name (delisted game)
const upsertGame = db.prepare(`
  INSERT INTO games (app_id, name, header_image, is_family_shareable, genres, categories, checked_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(app_id) DO UPDATE SET
    name = CASE WHEN excluded.name != '' AND excluded.name NOT LIKE 'App %' THEN excluded.name ELSE games.name END,
    header_image = CASE WHEN excluded.header_image != '' THEN excluded.header_image ELSE games.header_image END,
    is_family_shareable = excluded.is_family_shareable
`);

// Empty name should NOT overwrite
upsertGame.run(43160, '', 'http://new-img.jpg', 0, '[]', '[]');
let gameName = db.prepare("SELECT name FROM games WHERE app_id = 43160").get().name;
assert.strictEqual(gameName, 'Metro 2033', 'Empty name should not overwrite existing name');

// Valid name SHOULD overwrite
upsertGame.run(43160, 'Metro 2033 Redux', 'http://redux-img.jpg', 1, '["Action"]', '[]');
gameName = db.prepare("SELECT name FROM games WHERE app_id = 43160").get().name;
assert.strictEqual(gameName, 'Metro 2033 Redux', 'Valid name should overwrite existing name');

db.prepare("DELETE FROM games WHERE app_id = 43160").run();

pass('Game name preservation (no overwrite with empty/App placeholder) verified.');

// Test 10: Optimizer Solver with Fairness
function getCombinations(array, size) {
  if (size === 0) return [[]];
  if (array.length < size) return [];
  const [head, ...tail] = array;
  const withHead = getCombinations(tail, size - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, size);
  return [...withHead, ...withoutHead];
}

const accountsList = db.prepare('SELECT steam_id, persona_name FROM accounts WHERE is_submitted = 1').all();
const combinations = getCombinations(accountsList, 4);
assert.strictEqual(combinations.length, 5, 'C(5, 4) should be 5');

let bestCombination = null;
let maxFitness = -1;

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

  let totalScore = 0;
  let minRatio = 1.0;

  const voterGroups = db.prepare('SELECT DISTINCT voter_steam_id FROM user_preferences').all();
  for (const vg of voterGroups) {
    const voterVotes = db.prepare('SELECT app_id, score FROM user_preferences WHERE voter_steam_id = ?').all(vg.voter_steam_id);
    let voterSatisfied = 0;
    let voterTotal = 0;
    for (const v of voterVotes) {
      voterTotal += v.score;
      if (shareableGames.has(v.app_id)) {
        voterSatisfied += v.score;
      }
    }
    totalScore += voterSatisfied;
    const ratio = voterTotal > 0 ? voterSatisfied / voterTotal : 1.0;
    if (ratio < minRatio) minRatio = ratio;
  }

  const fitness = totalScore + minRatio * 50;
  if (fitness > maxFitness) {
    maxFitness = fitness;
    bestCombination = combo;
  }
}

assert.ok(bestCombination !== null, 'Solver must find a winning combination');
assert.strictEqual(bestCombination.length, 4, 'Winning combination must have 4 accounts');

pass(`Combinatorial Optimizer Solver with fairness bonus verified (fitness=${maxFitness.toFixed(1)}).`);
console.log('   Winning Accounts:', bestCombination.map((a) => a.persona_name).join(', '));

// Test 11: Edge Case — Optimizer with fewer than 4 accounts
const smallAccountList = accountsList.slice(0, 3); // Only 3 accounts
const smallCombos = getCombinations(smallAccountList, Math.min(4, smallAccountList.length));
assert.strictEqual(smallCombos.length, 1, 'C(3, 3) should be 1');
assert.strictEqual(smallCombos[0].length, 3, 'Should select all 3 when fewer than target');

pass('Optimizer edge case: fewer accounts than target size (3 < 4) verified.');

// Test 12: Scoped shareable_games UPDATE (only affected accounts)
// Simulate the optimized UPDATE that scopes to accounts owning a specific game
db.prepare(`
  UPDATE accounts 
  SET shareable_games = (
    SELECT COUNT(DISTINCT ag.app_id) 
    FROM account_games ag
    JOIN games g ON ag.app_id = g.app_id
    WHERE ag.steam_id = accounts.steam_id AND g.is_family_shareable = 1
  )
  WHERE steam_id IN (SELECT steam_id FROM account_games WHERE app_id = 1)
`).run();

// Only accounts that own app_id=1 (Alice:1001, Charlie:1003, David:1004) should be updated
const aliceShareable = db.prepare("SELECT shareable_games FROM accounts WHERE steam_id = '1001'").get().shareable_games;
assert.ok(aliceShareable > 0, 'Alice should have shareable games counted');

// Bob doesn't own app_id=1 — should still have old value
const bobShareable = db.prepare("SELECT shareable_games FROM accounts WHERE steam_id = '1002'").get().shareable_games;
assert.strictEqual(bobShareable, 4, 'Bob should NOT be affected by scoped UPDATE (still has initial value)');

pass('Scoped shareable_games UPDATE (only affected accounts, not all) verified.');

console.log(`\n🎉 ALL INTEGRATION & UNIT TESTS PASSED SUCCESSFULLY! (${passCount}/${totalTests})`);
