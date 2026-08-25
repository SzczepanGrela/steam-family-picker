'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Trophy, Users, Gamepad2, ChevronDown, ChevronUp, Check, AlertCircle, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';
import { OptimizationResult } from '@/lib/optimizer';

interface ResultsDashboardProps {
  data: OptimizationResult;
}

export default function ResultsDashboard({ data }: ResultsDashboardProps) {
  const [expandedVoter, setExpandedVoter] = useState<string | null>(null);

  const toggleVoter = (id: string) => {
    setExpandedVoter(expandedVoter === id ? null : id);
  };

  return (
    <div className="space-y-10" id="results-section">
      {/* Victory Banner */}
      <div className="relative rounded-3xl p-8 bg-gradient-to-r from-steam-navy via-steam-card to-steam-navy border border-steam-green/50 shadow-glow-green overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-steam-green/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-steam-green/20 border border-steam-green/40 text-steam-green text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optymalna Rodzina Steam Została Wybrana</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Zwycięska Czwórka Kont 🏆
            </h2>
            <p className="text-sm text-steam-textMuted max-w-xl">
              Poniższy zestaw 4 bibliotek zapewnia najwyższe łączne zadowolenie całej grupy ({data.averageSatisfactionPercent}%) i dostarcza {data.totalFamilyGamesCount} unikalnych gier z Family Sharing.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-steam-dark/80 backdrop-blur-md p-4 rounded-2xl border border-steam-border/60">
            <div className="text-center px-3 border-r border-steam-border/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-steam-green">{data.averageSatisfactionPercent}%</div>
              <div className="text-[10px] text-steam-textMuted uppercase font-semibold">Zadowolenie grupy</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-steam-blue">{data.totalFamilyGamesCount}</div>
              <div className="text-[10px] text-steam-textMuted uppercase font-semibold">Gier w Rodzinie</div>
            </div>
          </div>
        </div>
      </div>

      {/* Winning 4 Accounts Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <Trophy className="w-5 h-5 text-steam-highlight" />
          <h3>Członkowie Nowej Rodziny Steam</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.winningAccounts.map((acc, index) => (
            <div
              key={acc.steam_id}
              className="relative bg-steam-card border border-steam-green/40 hover:border-steam-green rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="absolute -top-3 -right-2 px-2.5 py-0.5 rounded-full bg-steam-green text-steam-dark text-xs font-black shadow-md flex items-center gap-1">
                <span>#{index + 1}</span>
              </div>

              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-steam-green shadow-glow-green flex-shrink-0">
                    <Image
                      src={acc.avatar_url || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                      alt={acc.persona_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white text-base truncate group-hover:text-steam-green transition-colors" title={acc.persona_name}>
                      {acc.persona_name}
                    </h4>
                    <a
                      href={acc.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-steam-textMuted hover:text-steam-blue truncate block"
                    >
                      Profil Steam ↗
                    </a>
                  </div>
                </div>

                <div className="space-y-2 bg-steam-dark/60 p-3 rounded-xl border border-steam-border/40 text-xs">
                  <div className="flex justify-between">
                    <span className="text-steam-textMuted">Współdzielone gry:</span>
                    <span className="font-bold text-white">{acc.shareable_games}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steam-textMuted">Unikalny wkład do rodziny:</span>
                    <span className="font-bold text-steam-highlight">+{acc.uniqueGamesContributed} gier</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-steam-border/40 flex items-center justify-center gap-1.5 text-xs text-steam-green font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Kwalifikuje się do Rodziny</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Voter Satisfaction Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <HeartHandshake className="w-5 h-5 text-steam-blue" />
            <h3>Zadowolenie Uczestników & Pokrycie Życzeń</h3>
          </div>
          <span className="text-xs text-steam-textMuted hidden sm:inline">
            Kliknij na gracza, aby zobaczyć spełnione i brakujące gry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.voterBreakdowns.map((voter) => {
            const isExpanded = expandedVoter === voter.voter_steam_id;

            return (
              <div
                key={voter.voter_steam_id}
                className="bg-steam-card border border-steam-border/80 rounded-2xl p-5 transition-all shadow-md"
              >
                <div
                  onClick={() => toggleVoter(voter.voter_steam_id)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {voter.voter_avatar ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-steam-border flex-shrink-0">
                        <Image
                          src={voter.voter_avatar}
                          alt={voter.voter_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-steam-blue/20 flex items-center justify-center text-steam-blue font-bold flex-shrink-0">
                        {voter.voter_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-steam-blue transition-colors">
                        {voter.voter_name}
                      </h4>
                      <p className="text-[11px] text-steam-textMuted">
                        Spełniono {voter.satisfiedGames.length} z {voter.satisfiedGames.length + voter.missingGames.length} wybranych gier
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`font-extrabold text-base ${voter.satisfactionPercent >= 70 ? 'text-steam-green' : voter.satisfactionPercent >= 40 ? 'text-steam-highlight' : 'text-steam-danger'}`}>
                        {voter.satisfactionPercent}%
                      </div>
                    </div>
                    <div className="p-1 rounded-lg bg-steam-navy text-steam-textMuted group-hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-steam-dark overflow-hidden mt-3 border border-steam-border/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      voter.satisfactionPercent >= 70
                        ? 'bg-steam-green'
                        : voter.satisfactionPercent >= 40
                        ? 'bg-steam-highlight'
                        : 'bg-steam-danger'
                    }`}
                    style={{ width: `${voter.satisfactionPercent}%` }}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-steam-border/50 space-y-4 animate-fadeIn text-xs">
                    {/* Satisfied Games */}
                    {voter.satisfiedGames.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-bold text-steam-green flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Dostępne w Rodzinie ({voter.satisfiedGames.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {voter.satisfiedGames.map((g) => (
                            <div
                              key={g.app_id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-steam-dark/60 border border-steam-border/40"
                            >
                              <div className="relative w-12 h-6 rounded overflow-hidden flex-shrink-0 bg-steam-navy">
                                <Image src={g.header_image} alt={g.name} fill className="object-cover" unoptimized />
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="font-medium text-white truncate">{g.name}</div>
                                <div className="text-[10px] text-steam-textMuted truncate">Od: {g.providedBy}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Games */}
                    {voter.missingGames.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-bold text-steam-textMuted flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Poza Rodziną ({voter.missingGames.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {voter.missingGames.map((g) => (
                            <div
                              key={g.app_id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-steam-dark/40 border border-steam-border/30 opacity-75"
                            >
                              <div className="relative w-12 h-6 rounded overflow-hidden flex-shrink-0 bg-steam-navy">
                                <Image src={g.header_image} alt={g.name} fill className="object-cover" unoptimized />
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="font-medium text-steam-textMuted truncate">{g.name}</div>
                                {g.availableOnOfflineAccount ? (
                                  <div className="text-[10px] text-steam-highlight truncate">
                                    Dostępne offline na koncie: {g.availableOnOfflineAccount}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-steam-danger truncate">Brak w puli</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Games Vault */}
      {data.offlineVaultGames.length > 0 && (
        <div className="space-y-4 bg-steam-card border border-steam-border rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-steam-highlight/20 text-steam-highlight">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Strefa Gier Offline (Pozostałe Konta)</h3>
                <p className="text-xs text-steam-textMuted">
                  Gry pożądane przez znajomych, które znajdują się na kontach poza główną Rodziną (można w nie grać logując się na konto w trybie offline).
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-steam-navy text-xs font-bold text-steam-highlight border border-steam-border">
              {data.offlineVaultGames.length} gier
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {data.offlineVaultGames.map((game) => (
              <div
                key={game.app_id}
                className="flex items-center gap-3 p-3 rounded-xl bg-steam-dark/70 border border-steam-border/60 hover:border-steam-borderHover transition-all"
              >
                <div className="relative w-20 aspect-[460/215] rounded-lg overflow-hidden flex-shrink-0 bg-steam-navy">
                  <Image src={game.header_image} alt={game.name} fill className="object-cover" unoptimized />
                </div>
                <div className="overflow-hidden flex-1">
                  <h5 className="font-bold text-white text-xs truncate" title={game.name}>
                    {game.name}
                  </h5>
                  <div className="text-[11px] text-steam-highlight mt-0.5">
                    Właściciel: <strong>{game.ownedByAccount}</strong>
                  </div>
                  <div className="text-[10px] text-steam-textMuted mt-0.5">
                    Chce zagrać: {game.requestedByCount} {game.requestedByCount === 1 ? 'osoba' : 'osoby'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
