import React from 'react';
import Link from 'next/link';
import { Users, Gamepad2, Vote, Sparkles, Shield, ChevronRight } from 'lucide-react';
import PhaseCards from '@/components/PhaseCards';
import ResultsDashboard from '@/components/ResultsDashboard';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';
import { calculateOptimalFamily } from '@/lib/optimizer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSteamSession();
  const phase = getSystemPhase();

  // Fetch quick stats from database
  const accountsCount = (db.prepare('SELECT COUNT(*) as count FROM accounts WHERE is_submitted = 1').get() as { count: number })?.count || 0;
  const gamesCount = (db.prepare('SELECT COUNT(DISTINCT app_id) as count FROM games WHERE is_family_shareable = 1').get() as { count: number })?.count || 0;
  const votersCount = (db.prepare('SELECT COUNT(DISTINCT voter_steam_id) as count FROM user_preferences').get() as { count: number })?.count || 0;

  let isSubmitted = false;
  if (session) {
    const acc = db.prepare('SELECT is_submitted FROM accounts WHERE steam_id = ?').get(session.steamId) as { is_submitted: number } | undefined;
    isSubmitted = acc?.is_submitted === 1;
  }

  // If phase is completed, get results
  const results = phase === 'completed' ? calculateOptimalFamily() : null;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative text-center max-w-3xl mx-auto pt-6 pb-2 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-steam-blue/10 border border-steam-blue/30 text-steam-blue text-xs font-semibold shadow-glow-blue animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Głosowanie & Wybór 4 Kont do Rodziny Steam</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Wybierzmy Najlepszą <br />
          <span className="bg-gradient-to-r from-steam-blue via-steam-accent to-steam-green bg-clip-text text-transparent">
            Rodzinę Steam
          </span>
        </h1>

        <p className="text-sm sm:text-base text-steam-textMuted max-w-xl mx-auto leading-relaxed">
          Zgłoś swoją bibliotekę, wskaż gry, w które najbardziej chcesz zagrać, a inteligentny algorytm dobierze 4 konta, które zmaksymalizują radość ze wspólnego grania dla każdego z nas!
        </p>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-4">
          <div className="bg-steam-card/80 border border-steam-border/60 p-3 rounded-2xl shadow-sm">
            <div className="text-xl sm:text-2xl font-black text-white">{accountsCount}</div>
            <div className="text-[11px] text-steam-textMuted font-medium flex items-center justify-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-steam-blue" />
              <span>Zgłoszone konta</span>
            </div>
          </div>

          <div className="bg-steam-card/80 border border-steam-border/60 p-3 rounded-2xl shadow-sm">
            <div className="text-xl sm:text-2xl font-black text-steam-highlight">{gamesCount}</div>
            <div className="text-[11px] text-steam-textMuted font-medium flex items-center justify-center gap-1 mt-0.5">
              <Gamepad2 className="w-3 h-3 text-steam-highlight" />
              <span>Gier Family Share</span>
            </div>
          </div>

          <div className="bg-steam-card/80 border border-steam-border/60 p-3 rounded-2xl shadow-sm">
            <div className="text-xl sm:text-2xl font-black text-steam-green">{votersCount}</div>
            <div className="text-[11px] text-steam-textMuted font-medium flex items-center justify-center gap-1 mt-0.5">
              <Vote className="w-3 h-3 text-steam-green" />
              <span>Głosujących osób</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Phase Cards */}
      <PhaseCards
        phase={phase}
        isLoggedIn={!!session}
        isSubmitted={isSubmitted}
      />

      {/* Phase 3: Results Dashboard if completed */}
      {phase === 'completed' && results && (
        <ResultsDashboard data={results} />
      )}

      {/* How it works info section */}
      <div className="border-t border-steam-border/40 pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-steam-textMuted">
        <div className="space-y-2 bg-steam-card/40 p-5 rounded-xl border border-steam-border/30">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-steam-blue/20 text-steam-blue flex items-center justify-center text-xs">1</span>
            Tylko Gry Współdzielone
          </h4>
          <p>
            System automatycznie filtruje gry, sprawdzając w Steam Store API, czy gra posiada wsparcie dla Rodziny Steam (np. wyklucza gry wymagające zewnętrznych launcherów jak Rust czy EA Play).
          </p>
        </div>

        <div className="space-y-2 bg-steam-card/40 p-5 rounded-xl border border-steam-border/30">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-steam-highlight/20 text-steam-highlight flex items-center justify-center text-xs">2</span>
            Matematyczna Optymalizacja
          </h4>
          <p>
            Algorytm sprawdza wszystkie możliwe 4-elementowe kombinacje kont i wybiera tę, która spełnia najwięcej życzeń graczy, dbając jednocześnie o sprawiedliwy podział.
          </p>
        </div>

        <div className="space-y-2 bg-steam-card/40 p-5 rounded-xl border border-steam-border/30">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-steam-green/20 text-steam-green flex items-center justify-center text-xs">3</span>
            Konta Offline dla Reszty
          </h4>
          <p>
            Osoby, których konta nie znajdą się w głównej Rodzinie, otrzymują dostęp do gier w trybie offline, dzięki czemu nikt nie traci dostępu do gier single-player!
          </p>
        </div>
      </div>
    </div>
  );
}
