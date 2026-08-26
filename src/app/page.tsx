import React from 'react';
import PhaseCards from '@/components/PhaseCards';
import ResultsDashboard from '@/components/ResultsDashboard';
import HomeStatsHeader from '@/components/HomeStatsHeader';
import VoterStatusWidget from '@/components/VoterStatusWidget';
import VotingRulesModal from '@/components/VotingRulesModal';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';
import { calculateOptimalFamily } from '@/lib/optimizer';
import { UserPlus, Sparkles, Trophy, HelpCircle } from 'lucide-react';

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

  // Fetch submitted accounts for widgets
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

      {/* Phase 1: Registered accounts widget & How it works guide */}
      {phase === 'registration' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Registered Players widget */}
          {votersStatus.length > 0 && (
            <VoterStatusWidget
              votersStatus={votersStatus}
              title="Biblioteki zgłoszone do wspólnej puli"
              isRegistrationPhase={true}
            />
          )}

          {/* Quick Explainer Card */}
          <div className="p-6 rounded-3xl bg-steam-card border border-steam-border shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-steam-border/40 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-steam-highlight" />
                  <span>Jak działa dobór optymalnej Rodziny Steam?</span>
                </h3>
                <p className="text-xs text-steam-textMuted mt-0.5">
                  Algorytm maksymalizuje liczbę gier, w które wszyscy w grupie naprawdę chcą grać.
                </p>
              </div>
              <VotingRulesModal triggerText="Szczegółowe zasady" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-steam-dark/70 border border-steam-border/40 space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-steam-blue/20 text-steam-blue flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h4 className="font-bold text-white text-xs">Zgłoszenie biblioteki</h4>
                <p className="text-[11px] text-steam-textMuted leading-relaxed">
                  Logujesz się przez Steam. System automatycznie weryfikuje gry objęte funkcją Family Sharing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-steam-dark/70 border border-steam-border/40 space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-steam-highlight/20 text-steam-highlight flex items-center justify-center font-black text-xs">
                  2
                </div>
                <h4 className="font-bold text-white text-xs">Wskazanie gier & Ranking</h4>
                <p className="text-[11px] text-steam-textMuted leading-relaxed">
                  Zaznaczasz gry z katalogu (Must-Have / Chętnie) i układasz biblioteki znajomych w tier liście.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-steam-dark/70 border border-steam-border/40 space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-steam-green/20 text-steam-green flex items-center justify-center font-black text-xs">
                  3
                </div>
                <h4 className="font-bold text-white text-xs">Optymalny Skład TOP 6</h4>
                <p className="text-[11px] text-steam-textMuted leading-relaxed">
                  Matematyczny algorytm wyłania 6 kont tworzących najbogatszy zestaw unikalnych gier dla grupy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Voter Turnout Widget */}
      {phase === 'voting' && votersStatus.length > 0 && (
        <VoterStatusWidget
          votersStatus={votersStatus}
          title="Status głosowania zarejestrowanych graczy"
        />
      )}

      {/* Phase 3: Results Section */}
      {phase === 'completed' && results && (
        <ResultsDashboard data={results} />
      )}
    </div>
  );
}
