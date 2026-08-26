import { NextResponse } from 'next/server';
import { db, getSystemPhase } from '@/lib/db';
import { getQueueStatus } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const phase = getSystemPhase();

  const accountsCount = (db.prepare('SELECT COUNT(*) as count FROM accounts WHERE is_submitted = 1').get() as { count: number })?.count || 0;
  
  const gamesCount = (db.prepare(`
    SELECT COUNT(DISTINCT g.app_id) as count 
    FROM games g 
    JOIN account_games ag ON g.app_id = ag.app_id 
    JOIN accounts a ON ag.steam_id = a.steam_id 
    WHERE g.is_family_shareable = 1 AND a.is_submitted = 1
  `).get() as { count: number })?.count || 0;

  const totalRegisteredGames = (db.prepare(`
    SELECT COUNT(DISTINCT g.app_id) as count 
    FROM games g 
    JOIN account_games ag ON g.app_id = ag.app_id 
    JOIN accounts a ON ag.steam_id = a.steam_id 
    WHERE a.is_submitted = 1
  `).get() as { count: number })?.count || 0;
  
  // Total value of all shareable games in catalog
  const totalShareableValueCents = (db.prepare(`
    SELECT SUM(t.price_final) as val FROM (
      SELECT g.price_final 
      FROM games g 
      JOIN account_games ag ON g.app_id = ag.app_id 
      JOIN accounts a ON ag.steam_id = a.steam_id 
      WHERE g.is_family_shareable = 1 AND a.is_submitted = 1
      GROUP BY g.app_id
    ) t
  `).get() as { val: number })?.val || 0;

  // Active voters count (ONLY officially submitted ballots)
  const votersCount = (db.prepare(`
    SELECT COUNT(*) as count FROM ballot_submissions
  `).get() as { count: number })?.count || 0;

  // Detailed turnout list for all registered accounts
  const accounts = db.prepare(`
    SELECT steam_id, persona_name, avatar_url
    FROM accounts
    WHERE is_submitted = 1
    ORDER BY created_at ASC
  `).all() as Array<{ steam_id: string; persona_name: string; avatar_url: string }>;

  const submittedVotersSet = new Set(
    (db.prepare('SELECT voter_steam_id FROM ballot_submissions').all() as Array<{ voter_steam_id: string }>).map((r) => r.voter_steam_id)
  );

  const gameVotesCountMap = new Map<string, number>();
  const gameVotesRows = db.prepare(`
    SELECT voter_steam_id, COUNT(*) as c 
    FROM user_preferences 
    GROUP BY voter_steam_id
  `).all() as Array<{ voter_steam_id: string; c: number }>;
  gameVotesRows.forEach((r) => gameVotesCountMap.set(r.voter_steam_id, r.c));

  const accPrefsCountMap = new Map<string, number>();
  const accPrefsRows = db.prepare(`
    SELECT voter_steam_id, COUNT(*) as c 
    FROM account_preferences 
    WHERE tier > 0
    GROUP BY voter_steam_id
  `).all() as Array<{ voter_steam_id: string; c: number }>;
  accPrefsRows.forEach((r) => accPrefsCountMap.set(r.voter_steam_id, r.c));

  const votersStatus = accounts.map((a) => {
    const gCount = gameVotesCountMap.get(a.steam_id) || 0;
    const aCount = accPrefsCountMap.get(a.steam_id) || 0;
    const hasVoted = submittedVotersSet.has(a.steam_id);
    return {
      steamId: a.steam_id,
      personaName: a.persona_name,
      avatarUrl: a.avatar_url,
      hasVoted,
      gameVotesCount: gCount,
      accountPrefsCount: aCount,
    };
  });

  const queueStatus = getQueueStatus();

  return NextResponse.json({
    phase,
    accountsCount,
    gamesCount,
    totalRegisteredGames,
    totalShareableValueCents,
    votersCount,
    votersStatus,
    queueStatus,
  });
}
