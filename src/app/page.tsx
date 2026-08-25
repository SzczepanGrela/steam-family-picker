import React from 'react';
import { Users, Gamepad2, Vote } from 'lucide-react';
import PhaseCards from '@/components/PhaseCards';
import ResultsDashboard from '@/components/ResultsDashboard';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';
import { calculateOptimalFamily } from '@/lib/optimizer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSteamSession();
  const phase = getSystemPhase();

  // Fetch stats from DB
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
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dobór Rodziny Steam
          </h1>
          <p className="text-xs text-steam-textMuted mt-1">
            Wybór 4 kont dających najlepszą pulę gier dla wszystkich uczestników.
          </p>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial bg-steam-card border border-steam-border/60 px-4 py-2 rounded-xl text-center">
            <div className="text-lg font-bold text-white">{accountsCount}</div>
            <div className="text-[10px] text-steam-textMuted flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-steam-blue" />
              <span>Konta</span>
            </div>
          </div>

          <div className="flex-1 md:flex-initial bg-steam-card border border-steam-border/60 px-4 py-2 rounded-xl text-center">
            <div className="text-lg font-bold text-steam-highlight">{gamesCount}</div>
            <div className="text-[10px] text-steam-textMuted flex items-center justify-center gap-1">
              <Gamepad2 className="w-3 h-3 text-steam-highlight" />
              <span>Gry Family</span>
            </div>
          </div>

          <div className="flex-1 md:flex-initial bg-steam-card border border-steam-border/60 px-4 py-2 rounded-xl text-center">
            <div className="text-lg font-bold text-steam-green">{votersCount}</div>
            <div className="text-[10px] text-steam-textMuted flex items-center justify-center gap-1">
              <Vote className="w-3 h-3 text-steam-green" />
              <span>Głosy</span>
            </div>
          </div>
        </div>
      </div>

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
