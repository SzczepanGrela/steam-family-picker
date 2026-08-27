#!/usr/bin/env node

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH || (fs.existsSync('/app/data/steam_family.db') ? '/app/data/steam_family.db' : path.join(process.cwd(), 'data', 'steam_family.db'));

try {
  const db = new DatabaseSync(dbPath);

  // 1. All submitted accounts
  const accounts = db.prepare('SELECT steam_id, persona_name, shareable_games FROM accounts WHERE is_submitted = 1').all();

  if (accounts.length === 0) {
    console.log('Brak zgłoszonych kont w bazie.');
    process.exit(0);
  }

  // 2. Game Demand Points
  const gameDemand = new Map();
  const gameVotes = db.prepare(`
    SELECT up.app_id, SUM(up.score) as score 
    FROM user_preferences up 
    JOIN ballot_submissions bs ON up.voter_steam_id = bs.voter_steam_id 
    WHERE up.score > 0 
    GROUP BY up.app_id
  `).all();
  for (const g of gameVotes) gameDemand.set(g.app_id, g.score);

  // 3. TierMaker direct ranking points (Normalized Mid-Rank Borda)
  const allPrefs = db.prepare(`
    SELECT ap.voter_steam_id, ap.target_steam_id, ap.tier 
    FROM account_preferences ap 
    JOIN ballot_submissions bs ON ap.voter_steam_id = bs.voter_steam_id
  `).all();
  const prefsByVoter = new Map();
  for (const p of allPrefs) {
    if (!prefsByVoter.has(p.voter_steam_id)) prefsByVoter.set(p.voter_steam_id, []);
    prefsByVoter.get(p.voter_steam_id).push(p);
  }

  const directPoints = new Map(accounts.map(a => [a.steam_id, 0]));
  for (const [voterId, prefs] of prefsByVoter.entries()) {
    const candidates = prefs.filter(p => p.target_steam_id !== voterId);
    const k = candidates.length;
    if (k === 0) continue;
    const tierGroups = new Map();
    for (const c of candidates) {
      if (!tierGroups.has(c.tier)) tierGroups.set(c.tier, []);
      tierGroups.get(c.tier).push(c.target_steam_id);
    }
    let currentRank = 1;
    for (const t of Array.from(tierGroups.keys()).sort((a,b) => b-a)) {
      const grp = tierGroups.get(t);
      const midRank = currentRank + (grp.length - 1) / 2;
      const borda = k > 1 ? Math.round(((k - midRank) / (k - 1)) * 100) : 100;
      for (const id of grp) {
        if (directPoints.has(id)) directPoints.set(id, directPoints.get(id) + borda);
      }
      currentRank += grp.length;
    }
  }

  // 4. Summarize per account
  const list = accounts.map(acc => {
    const accGames = db.prepare('SELECT app_id FROM account_games WHERE steam_id = ?').all(acc.steam_id);
    let gPoints = 0;
    for (const g of accGames) gPoints += (gameDemand.get(g.app_id) || 0);
    const dPoints = directPoints.get(acc.steam_id) || 0;
    return {
      Nick: acc.persona_name,
      'Suma Pkt': dPoints + gPoints,
      'Z rankingow': dPoints,
      'Z gier': gPoints,
      'Gry Share': acc.shareable_games,
    };
  });

  list.sort((a,b) => b['Suma Pkt'] - a['Suma Pkt'] || b['Gry Share'] - a['Gry Share']);

  console.log('\n🏆 PEŁNY RANKING WSZYSTKICH KONT (OFICJALNE WYNIKI):');
  console.table(list.map((r, i) => ({ Miejsce: '#' + (i + 1), ...r })));
  console.log(`Łącznie sklasyfikowano: ${list.length} kont.\n`);

} catch (err) {
  console.error('Błąd odczytu bazy danych:', err.message);
}
