'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Trophy, 
  Medal, 
  ExternalLink, 
  Eye, 
  Search, 
  Gamepad2, 
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Top10ResultsData } from '@/lib/optimizer';
import AccountLibraryModal from './AccountLibraryModal';
import VotingRulesModal from './VotingRulesModal';

interface Top10ResultsBoardProps {
  data: Top10ResultsData;
}

export default function Top10ResultsBoard({ data }: Top10ResultsBoardProps) {
  const [gameSearch, setGameSearch] = useState('');
  const [showAllGames, setShowAllGames] = useState(false);
  const [inspectSteamId, setInspectSteamId] = useState<string | null>(null);
  const [inspectName, setInspectName] = useState<string>('');

  const { 
    topAccounts, 
    totalVoters, 
    totalSubmittedAccounts, 
    totalUniqueShareableGames, 
    top6UniqueGamesCount,
    top6TotalValueFormatted,
    topGamesRequested 
  } = data;

  const filteredRequestedGames = topGamesRequested.filter((g) =>
    g.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const displayedRequestedGames = showAllGames
    ? filteredRequestedGames
    : filteredRequestedGames.slice(0, 12);

  return (
    <div id="results-section" className="space-y-6 pt-4 animate-fadeIn scroll-mt-20">
      <AccountLibraryModal
        steamId={inspectSteamId}
        accountName={inspectName}
        onClose={() => setInspectSteamId(null)}
      />

      {/* Top Banner */}
      <div className="bg-gradient-to-br from-steam-card via-steam-navy to-steam-card border border-steam-border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-steam-green/20 text-steam-green shadow-glow-green">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Oficjalne Wyniki: Ranking Bibliotek
              </h2>
              <p className="text-xs text-steam-textMuted mt-1">
                Zestawienie wyłonione na podstawie preferencji społeczności i zawartości bibliotek Steam.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <VotingRulesModal triggerText="Zasady punktacji" />
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-steam-border/40">
          <div className="bg-steam-dark/70 p-3.5 rounded-2xl border border-steam-border/40 text-center">
            <div className="text-xl font-black text-white">{totalSubmittedAccounts}</div>
            <div className="text-[10px] text-steam-textMuted uppercase tracking-wider">Konta w puli</div>
          </div>
          <div className="bg-steam-dark/70 p-3.5 rounded-2xl border border-steam-green/30 text-center">
            <div className="text-xl font-black text-steam-green">{totalUniqueShareableGames}</div>
            <div className="text-[10px] text-steam-textMuted uppercase tracking-wider">Gry Family Share</div>
          </div>
          <div className="bg-steam-dark/70 p-3.5 rounded-2xl border border-steam-border/40 text-center">
            <div className="text-xl font-black text-white">{totalVoters}</div>
            <div className="text-[10px] text-steam-textMuted uppercase tracking-wider">Głosujących graczy</div>
          </div>
          <div className="bg-steam-dark/70 p-3.5 rounded-2xl border border-steam-blue/30 text-center">
            <div className="text-xl font-black text-steam-blue">TOP {topAccounts.length}</div>
            <div className="text-[10px] text-steam-textMuted uppercase tracking-wider">Zestawienie Kont</div>
          </div>
        </div>

        {/* Top Unique Games & Value Metric Card */}
        {top6UniqueGamesCount > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-steam-blue/20 via-steam-navy to-steam-green/20 border border-steam-blue/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-steam-blue text-steam-dark font-black text-sm flex-shrink-0 flex items-center gap-1.5 shadow-md">
                <Trophy className="w-4 h-4" />
                <span>Czołówka</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Czołowe biblioteki w rankingu
                </h4>
                <p className="text-xs text-steam-textMuted mt-0.5">
                  Łącznie dają dostęp do <strong className="text-steam-green font-black">{top6UniqueGamesCount} unikalnych gier</strong> (bez duplikatów).
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-steam-dark/80 border border-steam-border text-center flex-shrink-0">
              <span className="text-[10px] text-steam-textMuted block uppercase tracking-wider">Szacunkowa wartość katalogu</span>
              <span className="text-sm font-black text-steam-blue">{top6TotalValueFormatted}</span>
            </div>
          </div>
        )}
      </div>

      {/* TOP 10 Leaderboard Bar Chart */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Medal className="w-5 h-5 text-steam-highlight" />
            <span>Ranking Kont TOP {topAccounts.length}</span>
          </h3>
          <span className="text-xs text-steam-textMuted">Uszeregowane według punktacji społeczności</span>
        </div>

        <div className="space-y-4">
          {topAccounts.map((acc) => {
            const isGold = acc.rank === 1;
            const isSilver = acc.rank === 2;
            const isBronze = acc.rank === 3;

            return (
              <div
                key={acc.steam_id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  isGold
                    ? 'bg-gradient-to-r from-yellow-500/10 via-steam-card to-steam-dark border-yellow-500/50 shadow-[0_0_20px_-5px_rgba(255,200,44,0.3)]'
                    : isSilver
                    ? 'bg-gradient-to-r from-slate-400/10 via-steam-card to-steam-dark border-slate-400/40'
                    : isBronze
                    ? 'bg-gradient-to-r from-amber-700/10 via-steam-card to-steam-dark border-amber-700/40'
                    : 'bg-steam-dark/80 border-steam-border/50 hover:border-steam-borderHover'
                }`}
              >
                {/* Account Row Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 rounded-2xl bg-steam-dark border border-steam-border flex items-center justify-center font-black text-sm flex-shrink-0">
                      {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${acc.rank}`}
                    </div>

                    {/* Avatar */}
                    <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 ${
                      isGold ? 'border-yellow-400' : isSilver ? 'border-slate-300' : isBronze ? 'border-amber-600' : 'border-steam-border'
                    }`}>
                      <Image
                        src={acc.avatar_url || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                        alt={acc.persona_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="overflow-hidden space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm sm:text-base truncate">{acc.persona_name}</h4>

                        <a
                          href={acc.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-steam-textMuted hover:text-white p-0.5"
                          title="Profil Steam"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      
                      {/* Metrics Breakdown */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-steam-textMuted">
                        <span>{acc.shareable_games} gier Family Share ({acc.shareable_value_formatted})</span>
                        <span>&bull;</span>
                        <span className="font-bold text-white">
                          {acc.total_score} pkt
                        </span>
                        <span className="text-[11px] text-steam-textMuted">
                          (🗳️ {acc.direct_pref_points} z rankingów + 🎮 {acc.game_demand_points} z gier)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => {
                        setInspectSteamId(acc.steam_id);
                        setInspectName(acc.persona_name);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-xs text-steam-blue font-bold transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Przeglądaj gry ({acc.shareable_games})</span>
                    </button>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-steam-dark overflow-hidden border border-steam-border/50 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isGold
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-300'
                          : isSilver
                          ? 'bg-gradient-to-r from-slate-400 to-slate-200'
                          : isBronze
                          ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                          : 'bg-gradient-to-r from-steam-blue to-steam-green'
                      }`}
                      style={{ width: `${Math.max(8, acc.score_percent)}%` }}
                    />
                  </div>
                </div>

                {/* Top Sample Games from this account */}
                {acc.top_games.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-steam-border/30 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-steam-textMuted font-semibold mr-1">Czołowe gry:</span>
                    {acc.top_games.map((g) => (
                      <span
                        key={g.app_id}
                        className="px-2 py-0.5 rounded-lg bg-steam-navy/80 border border-steam-border/40 text-[10px] text-white flex items-center gap-1"
                        title={g.name}
                      >
                        <span className="truncate max-w-[140px]">{g.name}</span>
                        {g.reviews_global_percent > 0 && (
                          <span className="text-steam-blue font-bold">{g.reviews_global_percent}%</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Finder Section ("W czyjej bibliotece jest moja gra?") */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-steam-blue" />
              <span>Najbardziej pożądane gry w grupie</span>
            </h3>
            <p className="text-xs text-steam-textMuted mt-0.5">
              Sprawdź, które tytuły cieszą się największym zainteresowaniem i u kogo są dostępne.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-textMuted" />
            <input
              type="text"
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
              placeholder="Wyszukaj grę..."
              className="w-full pl-9 pr-3 py-2 bg-steam-dark border border-steam-border rounded-xl text-xs text-white placeholder-steam-textMuted focus:outline-none focus:border-steam-blue"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedRequestedGames.map((g) => (
            <div
              key={g.app_id}
              className="p-3 rounded-2xl border border-steam-border/60 bg-steam-dark/80 flex flex-col justify-between gap-2 overflow-hidden transition-all hover:border-steam-borderHover"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-10 rounded-lg overflow-hidden bg-steam-dark flex-shrink-0 border border-steam-border/40">
                  <Image src={g.header_image} alt={g.name} fill className="object-cover" unoptimized />
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="font-bold text-white text-xs truncate" title={g.name}>{g.name}</h5>
                    <span className="px-1.5 py-0.5 rounded bg-steam-highlight/15 text-steam-highlight text-[9px] font-black flex-shrink-0">
                      🔥 {g.requested_by_count}
                    </span>
                  </div>
                  {g.price_formatted && (
                    <span className="text-[10px] text-steam-textMuted">{g.price_formatted}</span>
                  )}
                </div>
              </div>

              {/* Owners and reviews */}
              <div className="pt-2 border-t border-steam-border/30 flex items-center justify-between text-[10px]">
                <span className="text-steam-textMuted truncate">
                  Posiada: <span className="text-steam-green font-medium">{g.available_on_accounts.join(', ')}</span>
                </span>
                {g.reviews_global_percent > 0 && (
                  <span className="text-steam-blue font-bold flex-shrink-0 ml-1">
                    🌍 {g.reviews_global_percent}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRequestedGames.length > 12 && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllGames(!showAllGames)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-steam-navy hover:bg-steam-dark border border-steam-border text-xs font-bold text-white transition-colors"
            >
              <span>{showAllGames ? 'Pokaż mniej' : `Pokaż wszystkie pożądane gry (${filteredRequestedGames.length})`}</span>
              {showAllGames ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
