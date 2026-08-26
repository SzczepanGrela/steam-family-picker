import React from 'react';
import PhaseCards from '@/components/PhaseCards';
import ResultsDashboard from '@/components/ResultsDashboard';
import HomeStatsHeader from '@/components/HomeStatsHeader';
import VoterStatusWidget from '@/components/VoterStatusWidget';
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
  const votersCount = (db.prepare('SELECT COUNT(*) as count FROM ballot_submissions').get() as { count: number })?.count || 0;

  let isSubmitted = false;
  if (session) {
    const acc = db.prepare('SELECT is_submitted FROM accounts WHERE steam_id = ?').get(session.steamId) as { is_submitted: number } | undefined;
    isSubmitted = acc?.is_submitted === 1;
  }

  // Fetch turnout status for Phase 2 from official ballot_submissions
  const submittedAccounts = db.prepare('SELECT steam_id, persona_name, avatar_url FROM accounts WHERE is_submitted = 1 ORDER BY created_at ASC').all() as Array<{ steam_id: string; persona_name: string; avatar_url: string }>;
  const votedSet = new Set(
    (db.prepare('SELECT voter_steam_id FROM ballot_submissions').all() as Array<{ voter_steam_id: string }>).map((r) => r.voter_steam_id)
  );

  const votersStatus = submittedAccounts.map((a) => ({
    steamId: a.steam_id,
    personaName: a.persona_name,
    avatarUrl: a.avatar_url,
    hasVoted: votedSet.has(a.steam_id),
    gameVotesCount: 0,
    accountPrefsCount: 0,
  }));

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

      {/* Voter Turnout Widget during voting phase */}
      {phase === 'voting' && votersStatus.length > 0 && (
        <VoterStatusWidget
          votersStatus={votersStatus}
          title="Status głosowania zarejestrowanych graczy"
        />
      )}

      {/* Results Section (Phase 3) */}
      {phase === 'completed' && results && (
        <ResultsDashboard data={results} />
      )}
    </div>
  );
}
