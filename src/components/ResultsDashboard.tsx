'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Trophy, ChevronDown, ChevronUp, Check, AlertCircle, Gamepad2, ShieldCheck } from 'lucide-react';
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
    <div className="space-y-8 pt-4" id="results-section">
      {/* Overview Metrics Banner */}
      <div className="bg-steam-card border border-steam-green/50 rounded-2xl p-5 shadow-glow-green flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-steam-green font-bold text-xs uppercase">
            <Trophy className="w-4 h-4" />
            <span>Wybrana Rodzina Steam</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Zestawienie 4 Kont
          </h2>
          <p className="text-xs text-steam-textMuted mt-0.5">
            Zapewnia {data.totalFamilyGamesCount} gier ze średnim pokryciem życzeń {data.averageSatisfactionPercent}%.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-steam-dark/90 px-4 py-2.5 rounded-xl border border-steam-border/60">
          <div className="text-center px-2 border-r border-steam-border/50">
            <div className="text-xl font-black text-steam-green">{data.averageSatisfactionPercent}%</div>
            <div className="text-[10px] text-steam-textMuted uppercase font-medium">Pokrycie</div>
          </div>
          <div className="text-center px-2">
            <div className="text-xl font-black text-steam-blue">{data.totalFamilyGamesCount}</div>
            <div className="text-[10px] text-steam-textMuted uppercase font-medium">Gier w puli</div>
          </div>
        </div>
      </div>

      {/* Winning 4 Accounts */}
      <div className="space-y-3">
        <h3 className="font-bold text-white text-sm">Wybrane konta (4/4)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.winningAccounts.map((acc, idx) => (
            <div
              key={acc.steam_id}
              className="bg-steam-card border border-steam-green/30 hover:border-steam-green rounded-xl p-4 flex flex-col justify-between transition-colors group"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-steam-green flex-shrink-0">
                    <Image
                      src={acc.avatar_url || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                      alt={acc.persona_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white text-sm truncate" title={acc.persona_name}>
                      {acc.persona_name}
                    </h4>
                    <span className="text-[10px] text-steam-textMuted">Slot #{idx + 1}</span>
                  </div>
                </div>

                <div className="bg-steam-dark/60 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-steam-textMuted">
                    <span>Gry Family:</span>
                    <span className="text-white font-medium">{acc.shareable_games}</span>
                  </div>
                  <div className="flex justify-between text-steam-textMuted">
                    <span>Unikalny wkład:</span>
                    <span className="text-steam-highlight font-medium">+{acc.uniqueGamesContributed}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-steam-border/40 flex items-center gap-1 text-[11px] text-steam-green font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>W Rodzinie</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voter Satisfaction Breakdown */}
      <div className="space-y-3">
        <h3 className="font-bold text-white text-sm">Pokrycie gier per użytkownik</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.voterBreakdowns.map((voter) => {
            const isExpanded = expandedVoter === voter.voter_steam_id;

            return (
              <div
                key={voter.voter_steam_id}
                className="bg-steam-card border border-steam-border rounded-xl p-4 transition-all"
              >
                <div
                  onClick={() => toggleVoter(voter.voter_steam_id)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    {voter.voter_avatar ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-steam-border flex-shrink-0">
                        <Image src={voter.voter_avatar} alt={voter.voter_name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-steam-blue/20 flex items-center justify-center text-steam-blue font-bold text-xs flex-shrink-0">
                        {voter.voter_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-xs group-hover:text-steam-blue transition-colors">
                        {voter.voter_name}
                      </h4>
                      <p className="text-[10px] text-steam-textMuted">
                        {voter.satisfiedGames.length} z {voter.satisfiedGames.length + voter.missingGames.length} wybranych gier
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${voter.satisfactionPercent >= 70 ? 'text-steam-green' : voter.satisfactionPercent >= 40 ? 'text-steam-highlight' : 'text-steam-danger'}`}>
                      {voter.satisfactionPercent}%
                    </span>
                    <div className="p-1 text-steam-textMuted group-hover:text-white">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-steam-dark overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full ${
                      voter.satisfactionPercent >= 70
                        ? 'bg-steam-green'
                        : voter.satisfactionPercent >= 40
                        ? 'bg-steam-highlight'
                        : 'bg-steam-danger'
                    }`}
                    style={{ width: `${voter.satisfactionPercent}%` }}
                  />
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-steam-border/40 space-y-3 text-xs">
                    {voter.satisfiedGames.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-steam-green flex items-center gap-1">
                          <Check className="w-3 h-3" /> W Rodzinie:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {voter.satisfiedGames.map((g) => (
                            <div key={g.app_id} className="flex items-center gap-2 p-1.5 rounded bg-steam-dark/60 text-[11px]">
                              <div className="relative w-8 h-4 rounded overflow-hidden bg-steam-navy flex-shrink-0">
                                <Image src={g.header_image} alt={g.name} fill className="object-cover" unoptimized />
                              </div>
                              <span className="truncate text-white" title={g.name}>{g.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {voter.missingGames.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-steam-textMuted flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Poza Rodziną:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {voter.missingGames.map((g) => (
                            <div key={g.app_id} className="flex items-center gap-2 p-1.5 rounded bg-steam-dark/40 text-[11px] opacity-75">
                              <div className="relative w-8 h-4 rounded overflow-hidden bg-steam-navy flex-shrink-0">
                                <Image src={g.header_image} alt={g.name} fill className="object-cover" unoptimized />
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="truncate text-steam-textMuted">{g.name}</div>
                                {g.availableOnOfflineAccount && (
                                  <div className="text-[9px] text-steam-highlight truncate">Offline: {g.availableOnOfflineAccount}</div>
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
        <div className="bg-steam-card border border-steam-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-steam-highlight" />
              <h3 className="font-bold text-white text-sm">Gry z pozostałych kont (Offline)</h3>
            </div>
            <span className="text-[11px] text-steam-textMuted">{data.offlineVaultGames.length} pozycji</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {data.offlineVaultGames.map((game) => (
              <div
                key={game.app_id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-steam-dark/70 border border-steam-border/40 text-xs"
              >
                <div className="relative w-14 aspect-[460/215] rounded overflow-hidden flex-shrink-0 bg-steam-navy">
                  <Image src={game.header_image} alt={game.name} fill className="object-cover" unoptimized />
                </div>
                <div className="overflow-hidden flex-1">
                  <h5 className="font-medium text-white truncate" title={game.name}>{game.name}</h5>
                  <div className="text-[10px] text-steam-highlight truncate">Konto: {game.ownedByAccount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
