import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), './data/steam_family.db');
const db = new DatabaseSync(dbPath);

console.log('Setting up 10 accounts with 8 voted for Phase 2 test...');

// 1. Set phase to 'voting'
db.prepare("INSERT INTO system_settings (key, value) VALUES ('phase', 'voting') ON CONFLICT(key) DO UPDATE SET value = 'voting'").run();

// 2. Ensure Peeman is registered and has unvoted status
const peemanId = '76561198057165915';

// 3. Define 6 additional realistic test accounts
const additionalAccounts = [
  {
    steam_id: '76561198012345678',
    persona_name: 'Kuba_Gamer',
    avatar_url: 'https://avatars.steamstatic.com/b5bd56c1aa99e440b0700732a39c3be7c433a4f6_full.jpg',
    profile_url: 'https://steamcommunity.com/profiles/76561198012345678',
  },
  {
    steam_id: '76561198087654321',
    persona_name: 'Maksymilian',
    avatar_url: 'https://avatars.steamstatic.com/6bd7ebfa0790938ff5d568c01d4a6fbb4ec62b08_full.jpg',
    profile_url: 'https://steamcommunity.com/profiles/76561198087654321',
  },
  {
    steam_id: '76561198123456789',
    persona_name: 'Szymon_PL',
    avatar_url: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    profile_url: 'https://steamcommunity.com/profiles/76561198123456789',
  },
  {
    steam_id: '76561198234567890',
    persona_name: 'Klaudia_99',
    avatar_url: 'https://avatars.steamstatic.com/d949479b1d9bf5b26ec588e0b6d2e96030999557_full.jpg',
    profile_url: 'https://steamcommunity.com/profiles/76561198234567890',
  },
  {
    steam_id: '76561198345678901',
    persona_name: 'Tomek_Steam',
    avatar_url: 'https://avatars.steamstatic.com/c489d84bf4bf782c5e5330364d08129df402377b_full.jpg',
    profile_url: 'https://steamcommunity.com/profiles/76561198345678901',
  },
  {
    steam_id: '76561198456789012',
    persona_name: 'Gracz_Pasywny',
    avatar_url: 'https://avatars.steamstatic.com/b282928811802a45d064cfb1029c6934c76045be_full.jpg',
    profile_url: 'https://steamcommunity.com/profiles/76561198456789012',
  },
];

// Get all shareable games from DB to distribute
const shareableGames = db.prepare('SELECT app_id FROM games WHERE is_family_shareable = 1').all();
const allGameIds = shareableGames.map((g) => g.app_id);

const insertAcc = db.prepare(`
  INSERT INTO accounts (steam_id, persona_name, avatar_url, profile_url, is_public, is_submitted, total_games, shareable_games, scan_status, created_at, last_scanned_at)
  VALUES (?, ?, ?, ?, 1, 1, ?, ?, 'completed', datetime('now'), datetime('now'))
  ON CONFLICT(steam_id) DO UPDATE SET
    persona_name = excluded.persona_name,
    avatar_url = excluded.avatar_url,
    profile_url = excluded.profile_url,
    is_submitted = 1,
    scan_status = 'completed',
    total_games = excluded.total_games,
    shareable_games = excluded.shareable_games
`);

const insertAccountGame = db.prepare(`
  INSERT OR IGNORE INTO account_games (steam_id, app_id, playtime_forever)
  VALUES (?, ?, ?)
`);

// Insert the 6 accounts and assign them distinct subsets of games
additionalAccounts.forEach((acc, idx) => {
  const count = 40 + (idx * 8);
  const offset = (idx * 25) % allGameIds.length;
  const accGames = [];
  for (let i = 0; i < count; i++) {
    accGames.push(allGameIds[(offset + i) % allGameIds.length]);
  }

  insertAcc.run(acc.steam_id, acc.persona_name, acc.avatar_url, acc.profile_url, accGames.length + 10, accGames.length);

  for (const appId of accGames) {
    const playtime = Math.floor(Math.random() * 3000) + 60;
    insertAccountGame.run(acc.steam_id, appId, playtime);
  }
});

// Update shareable_games counts for all accounts
db.prepare(`
  UPDATE accounts 
  SET shareable_games = (
    SELECT COUNT(DISTINCT ag.app_id) 
    FROM account_games ag
    JOIN games g ON ag.app_id = g.app_id
    WHERE ag.steam_id = accounts.steam_id AND g.is_family_shareable = 1
  )
`).run();

// 4. Fetch all 10 accounts
const allAccounts = db.prepare('SELECT steam_id, persona_name FROM accounts WHERE is_submitted = 1').all();
console.log(`Total accounts in pool: ${allAccounts.length}`);

// 5. Select 8 accounts that HAVE officially voted (exclude Peeman and Gracz_Pasywny)
const votedAccounts = allAccounts.filter((a) => a.steam_id !== peemanId && a.steam_id !== '76561198456789012').slice(0, 8);

// Clear old ballots
db.prepare('DELETE FROM ballot_submissions').run();
db.prepare('DELETE FROM account_preferences').run();
db.prepare('DELETE FROM user_preferences').run();

const insertBallot = db.prepare(`
  INSERT INTO ballot_submissions (voter_steam_id, submitted_at)
  VALUES (?, datetime('now', '-' || ? || ' minutes'))
`);

const insertAccPref = db.prepare(`
  INSERT INTO account_preferences (voter_steam_id, target_steam_id, tier, rank_order, updated_at)
  VALUES (?, ?, ?, ?, datetime('now'))
`);

const insertUserPref = db.prepare(`
  INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at)
  VALUES (?, ?, ?, datetime('now'))
`);

// Generate realistic votes for the 8 voted accounts
votedAccounts.forEach((voter, voterIndex) => {
  // Register official ballot submission
  insertBallot.run(voter.steam_id, (voterIndex + 1) * 15);

  // 1. Pick 8-15 games they like (Must-Have = 3, Interested = 1)
  const sampleGameIds = allGameIds.slice((voterIndex * 12) % allGameIds.length, ((voterIndex * 12) + 15) % allGameIds.length);
  sampleGameIds.forEach((gId, gIdx) => {
    insertUserPref.run(voter.steam_id, gId, gIdx < 5 ? 3 : 1);
  });

  // 2. Rank the remaining candidate accounts into Tiers (3, 2, 1, 0)
  const otherCandidates = allAccounts.filter((c) => c.steam_id !== voter.steam_id);
  otherCandidates.forEach((candidate, cIdx) => {
    let tier = 0;
    if (cIdx === 0 || cIdx === 1) tier = 3; // Poziom 1
    else if (cIdx === 2 || cIdx === 3) tier = 2; // Poziom 2
    else if (cIdx === 4 || cIdx === 5) tier = 1; // Poziom 3
    else tier = 0; // Neutralny

    insertAccPref.run(voter.steam_id, candidate.steam_id, tier, cIdx);
  });
});

console.log(`✅ Database successfully configured!`);
console.log(`- Phase: voting`);
console.log(`- Total registered accounts: ${allAccounts.length}`);
console.log(`- Accounts with submitted ballots: ${votedAccounts.length} / ${allAccounts.length}`);
console.log(`- Pending voters: Peeman (You) & Gracz_Pasywny`);
