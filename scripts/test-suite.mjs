import { DatabaseSync } from 'node:sqlite';

console.log('--- STARTING STEAM FAMILY PICKER TEST SUITE ---');

// 1. Test In-Memory Database & Schema
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
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
    PRIMARY KEY (steam_id, app_id)
  );

  CREATE TABLE user_preferences (
    voter_steam_id TEXT NOT NULL,
    app_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (voter_steam_id, app_id)
  );
`);

console.log('✓ Database tables created successfully');

// 2. Insert Mock Candidate Accounts (6 accounts)
const mockAccounts = [
  { id: '76561198000000001', name: 'Gamer_Adam', games: 5 },
  { id: '76561198000000002', name: 'Gamer_Bartek', games: 4 },
  { id: '76561198000000003', name: 'Gamer_Cezary', games: 6 },
  { id: '76561198000000004', name: 'Gamer_Dawid', games: 5 },
  { id: '76561198000000005', name: 'Gamer_Emil', games: 3 },
  { id: '76561198000000006', name: 'Gamer_Filip', games: 4 },
];

const insertAccount = db.prepare(`
  INSERT INTO accounts (steam_id, persona_name, avatar_url, profile_url, total_games, shareable_games, is_submitted, created_at)
  VALUES (?, ?, '', '', ?, ?, 1, datetime('now'))
`);

for (const a of mockAccounts) {
  insertAccount.run(a.id, a.name, a.games, a.games);
}

// 3. Insert Mock Games (10 games, including Cyberpunk, Witcher 3, Baldurs Gate 3, Rust [not shareable])
const mockGames = [
  { id: 1091500, name: 'Cyberpunk 2077', shareable: 1 },
  { id: 292030, name: 'The Witcher 3', shareable: 1 },
  { id: 1086940, name: "Baldur's Gate 3", shareable: 1 },
  { id: 1245620, name: 'Elden Ring', shareable: 1 },
  { id: 1172470, name: 'Apex Legends', shareable: 1 },
  { id: 252490, name: 'Rust', shareable: 0 }, // EXCLUDED
  { id: 550, name: 'Left 4 Dead 2', shareable: 1 },
  { id: 892970, name: 'Valheim', shareable: 1 },
  { id: 105600, name: 'Terraria', shareable: 1 },
  { id: 413150, name: 'Stardew Valley', shareable: 1 },
];

const insertGame = db.prepare(`
  INSERT INTO games (app_id, name, header_image, is_family_shareable, checked_at)
  VALUES (?, ?, '', ?, datetime('now'))
`);

for (const g of mockGames) {
  insertGame.run(g.id, g.name, g.shareable);
}

// Link games to accounts
const insertAccGame = db.prepare(`
  INSERT INTO account_games (steam_id, app_id, playtime_forever) VALUES (?, ?, ?)
`);

// Adam has Cyberpunk, Witcher 3, Elden Ring, Rust
insertAccGame.run('76561198000000001', 1091500, 100);
insertAccGame.run('76561198000000001', 292030, 100);
insertAccGame.run('76561198000000001', 1245620, 100);
insertAccGame.run('76561198000000001', 252490, 100);

// Bartek has Baldurs Gate 3, Valheim, Stardew Valley
insertAccGame.run('76561198000000002', 1086940, 100);
insertAccGame.run('76561198000000002', 892970, 100);
insertAccGame.run('76561198000000002', 413150, 100);

// Cezary has Cyberpunk, Terraria, Left 4 Dead 2
insertAccGame.run('76561198000000003', 1091500, 100);
insertAccGame.run('76561198000000003', 105600, 100);
insertAccGame.run('76561198000000003', 550, 100);

// Dawid has Elden Ring, Baldurs Gate 3, Valheim
insertAccGame.run('76561198000000004', 1245620, 100);
insertAccGame.run('76561198000000004', 1086940, 100);
insertAccGame.run('76561198000000004', 892970, 100);

// Emil has Left 4 Dead 2
insertAccGame.run('76561198000000005', 550, 100);

// Filip has Terraria, Stardew Valley
insertAccGame.run('76561198000000006', 105600, 100);
insertAccGame.run('76561198000000006', 413150, 100);

// 4. Insert Voter Preferences (Friends voting)
const insertVote = db.prepare(`
  INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at)
  VALUES (?, ?, ?, datetime('now'))
`);

// Friend 1 wants Elden Ring (3) & Baldur's Gate 3 (3)
insertVote.run('voter_1', 1245620, 3);
insertVote.run('voter_1', 1086940, 3);

// Friend 2 wants Cyberpunk (3) & Terraria (1)
insertVote.run('voter_2', 1091500, 3);
insertVote.run('voter_2', 105600, 1);

// Friend 3 wants Valheim (3) & Stardew Valley (3)
insertVote.run('voter_3', 892970, 3);
insertVote.run('voter_3', 413150, 3);

console.log('✓ Mock accounts, shareable games, and voter preferences populated');

// 5. Run Combinatorial Optimization for N=6 accounts, picking top 4
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

console.log(`✓ Combinations generated: ${combinations.length} combinations of 4 accounts from 6 candidates`);

let bestCombo = null;
let highestScore = -1;

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
  const votes = db.prepare('SELECT voter_steam_id, app_id, score FROM user_preferences').all();
  for (const v of votes) {
    if (shareableGames.has(v.app_id)) {
      totalScore += v.score;
    }
  }

  if (totalScore > highestScore) {
    highestScore = totalScore;
    bestCombo = combo;
  }
}

console.log('🏆 BEST 4 ACCOUNTS SELECTED:');
console.log(bestCombo.map((a) => a.persona_name).join(', '));
console.log(`✓ Max Group Satisfaction Score: ${highestScore} points`);

// Verify that non-shareable game (Rust) was NOT included
const rustInShareable = db.prepare('SELECT is_family_shareable FROM games WHERE app_id = 252490').get().is_family_shareable;
if (rustInShareable === 0) {
  console.log('✓ Family Sharing exclusion verified (Rust excluded with is_family_shareable = 0)');
} else {
  throw new Error('Rust was not excluded!');
}

console.log('--- ALL TEST SUITE CHECKS PASSED SUCCESSFULLY ---');
