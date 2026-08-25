import React from 'react';
import PhaseCards from '@/components/PhaseCards';
import ResultsDashboard from '@/components/ResultsDashboard';
import HomeStatsHeader from '@/components/HomeStatsHeader';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';
import { calculateOptimalFamily } from '@/lib/optimizer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSteamSession();
  const phase = getSystemPhase();

  // Fetch initial stats from DB
  const accountsCount = (db.prepare('SELECT COUNT(*) as count FROM accounts WHERE is_submitted = 1').get() as { count: number })?.count || 0;
  const gamesCount = (db.prepare('SELECT COUNT(DISTINCT app_id) as count FROM games WHERE is_family_shareable = 1').get() as { count: number })?.count || 0;
  const votersCount = (db.prepare('SELECT COUNT(DISTINCT voter_steam_id) as count FROM user_preferences').get() as { count: number })?.count || 0;

  let isSubmitted = false;
  if (session) {
    const acc = db.prepare('SELECT is_submitted FROM accounts WHERE steam_id = ?').get(session.steamId) as { is_submitted: number } | undefined;
    isSubmitted = acc?.is_submitted === 1;
  }

  // If completed, compute results
  const results = phase === 'completed' ? calculateOptimalFamily() : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header & Live Stats */}
      <HomeStatsHeader
        initialAccountsCount={accountsCount}
        initialGamesCount={gamesCount}
        initialVotersCount={votersCount}
      />

      {/* Phase Navigation Cards */}
      <PhaseCards
        phase={phase}
        isLoggedIn={!!session}
        isSubmitted={isSubmitted}
      />

      {/* Results Section (Phase 3) */}
      {phase === 'completed' && results && (
        <ResultsDashboard data={results} />
      )}
    </div>
  );
}
