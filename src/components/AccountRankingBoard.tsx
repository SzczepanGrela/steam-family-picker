'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Layers, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookmarkCheck,
  Gamepad2
} from 'lucide-react';
import AccountLibraryModal from './AccountLibraryModal';
import VotingRulesModal from './VotingRulesModal';
import { getAnonymousIdentity } from '@/lib/anonymous';

export interface AccountWithMatches {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
  totalGames: number;
  shareableGames: number;
  tier: number; // 3 (Poziom 1 - Najwyższy), 2 (Poziom 2 - Wysoki), 1 (Poziom 3 - Umiarkowany), 0 (Neutralny)
  rankOrder: number;
  matchedGamesCount: number;
  matchedGames: Array<{
    appId: number;
    name: string;
    headerImage: string;
    priceFormatted: string;
    reviewsGlobalPercent: number;
    reviewsGlobalDesc: string;
    reviewsPolishPercent: number;
    reviewsPolishDesc: string;
    voterScore: number;
  }>;
  allShareableGamesCount: number;
}

export function computeSmartGradation(accountsList: AccountWithMatches[]): AccountWithMatches[] {
  if (!accountsList || accountsList.length === 0) return [];

  const scored = [...accountsList].map((acc) => {
    const mustCount = (acc.matchedGames || []).filter((g) => g.voterScore === 3).length;
    const interestedCount = (acc.matchedGames || []).filter((g) => g.voterScore === 1).length;
    const matchScore = mustCount * 3 + interestedCount * 1;
    return { ...acc, matchScore };
  });

  const matched = scored.filter((a) => a.matchScore > 0);
  const unmatched = scored.filter((a) => a.matchScore === 0);

  // Sort matched accounts by matchScore descending, then shareableGames
  matched.sort((a, b) => b.matchScore - a.matchScore || b.shareableGames - a.shareableGames);
  unmatched.sort((a, b) => b.shareableGames - a.shareableGames);

  if (matched.length > 0) {
    const totalMatched = matched.length;
    const assignedMatched = matched.map((acc, idx) => {
      let tier = 1;
      // Proportional distribution across Poziom 1, Poziom 2, Poziom 3
      if (idx < Math.max(1, Math.ceil(totalMatched * 0.33))) {
        tier = 3; // Poziom 1 (Najwyższy)
      } else if (idx < Math.max(2, Math.ceil(totalMatched * 0.70))) {
        tier = 2; // Poziom 2 (Wysoki)
      } else {
        tier = 1; // Poziom 3 (Umiarkowany)
      }
      return { ...acc, tier, rankOrder: idx };
    });

    const assignedUnmatched = unmatched.map((acc, idx) => ({
      ...acc,
      tier: 0, // Poziom 4 (Neutralny)
      rankOrder: assignedMatched.length + idx,
    }));

    return [...assignedMatched, ...assignedUnmatched];
  } else {
    // If user has not chosen any games yet, distribute accounts gracefully by library size
    const allSorted = [...scored].sort((a, b) => b.shareableGames - a.shareableGames);
    const total = allSorted.length;
    return allSorted.map((acc, idx) => {
      let tier = 0;
      if (idx < Math.ceil(total * 0.25)) tier = 3;
      else if (idx < Math.ceil(total * 0.55)) tier = 2;
      else if (idx < Math.ceil(total * 0.85)) tier = 1;
      else tier = 0;
      return { ...acc, tier, rankOrder: idx };
    });
  }
}

interface AccountRankingBoardProps {
  initialAccounts: AccountWithMatches[];
  accounts: AccountWithMatches[];
  onAccountsChange: (updated: AccountWithMatches[]) => void;
  onSubmitBallot: () => void;
  hasSubmittedBallot: boolean;
  hasUnsavedChanges: boolean;
  isSubmitting?: boolean;
}

export default function AccountRankingBoard({
  initialAccounts,
  accounts,
  onAccountsChange,
  onSubmitBallot,
  hasSubmittedBallot,
  hasUnsavedChanges,
  isSubmitting,
}: AccountRankingBoardProps) {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [inspectSteamId, setInspectSteamId] = useState<string | null>(null);
  const [inspectName, setInspectName] = useState<string>('');

  const isInitializedRef = useRef(false);

  // Initialize accounts with smart proportional suggestion if all accounts are tier 0
  useEffect(() => {
    if (initialAccounts.length === 0) return;

    const allZero = accounts.length === 0 || accounts.every((a) => a.tier === 0);
    const hasCustomTiers = accounts.some((a) => a.tier > 0);

    if (allZero && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const suggested = computeSmartGradation(initialAccounts);
      onAccountsChange(suggested);
    } else if (hasCustomTiers && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const sorted = [...accounts].sort((a, b) => {
        if (b.tier !== a.tier) return b.tier - a.tier;
        return a.rankOrder - b.rankOrder;
      });
      onAccountsChange(sorted);
    }
  }, [initialAccounts, accounts, onAccountsChange]);

  const handleResetToSuggested = () => {
    const suggested = computeSmartGradation(initialAccounts.length > 0 ? initialAccounts : accounts);
    onAccountsChange(suggested);
  };

  const handleSetTier = (steamId: string, targetTier: number) => {
    const updated = accounts.map((acc) => {
      if (acc.steamId === steamId) {
        return { ...acc, tier: targetTier };
      }
      return acc;
    });
    onAccountsChange(updated);
  };

  const tierConfigs = [
    {
      tier: 3,
      levelLabel: 'Poziom 1',
      title: '🌟 Poziom 1: Najwyższy Priorytet',
      subtitle: 'Biblioteki, które najbardziej chcesz mieć we wspólnej rodzinie',
      badgeClass: 'bg-steam-highlight/20 text-steam-highlight border-steam-highlight/40',
      borderClass: 'border-steam-highlight/40',
      activePillClass: 'bg-steam-highlight text-steam-dark font-black',
    },
    {
      tier: 2,
      levelLabel: 'Poziom 2',
      title: '👍 Poziom 2: Wysoki Priorytet',
      subtitle: 'Wartościowe biblioteki z grami, w które bardzo chętnie zagrasz',
      badgeClass: 'bg-steam-blue/20 text-steam-blue border-steam-blue/40',
      borderClass: 'border-steam-blue/30',
      activePillClass: 'bg-steam-blue text-steam-dark font-black',
    },
    {
      tier: 1,
      levelLabel: 'Poziom 3',
      title: '👌 Poziom 3: Umiarkowany Priorytet',
      subtitle: 'Dobre pozycje uzupełniające pulę tytułów',
      badgeClass: 'bg-steam-green/20 text-steam-green border-steam-green/40',
      borderClass: 'border-steam-green/30',
      activePillClass: 'bg-steam-green text-steam-dark font-black',
    },
    {
      tier: 0,
      levelLabel: 'Poziom 4',
      title: '➖ Poziom 4: Pozostałe / Neutralne',
      subtitle: 'Brak szczególnych preferencji wobec tych kont',
      badgeClass: 'bg-steam-border/30 text-steam-textMuted border-steam-border/50',
      borderClass: 'border-steam-border/30',
      activePillClass: 'bg-steam-border text-white font-bold',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <AccountLibraryModal
        steamId={inspectSteamId}
        accountName={inspectName}
        onClose={() => setInspectSteamId(null)}
      />

      {/* Submission Banner Status */}
      {hasSubmittedBallot && !hasUnsavedChanges ? (
        <div className="p-4 rounded-3xl bg-steam-green/15 border border-steam-green/40 shadow-lg flex items-center justify-between gap-3 text-xs text-steam-green font-bold animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Twoje preferencje są zapisane i gotowe!</span>
          </div>
          <span className="text-[11px] text-steam-textMuted font-normal hidden sm:inline">
            (W każdej chwili możesz zmienić ułożenie i zapisać ponownie)
          </span>
        </div>
      ) : hasUnsavedChanges ? (
        <div className="p-4 rounded-3xl bg-yellow-500/15 border border-yellow-500/40 shadow-lg flex items-center justify-between gap-3 text-xs text-steam-highlight font-bold animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Masz niezapisane zmiany w rankingu. Kliknij przycisk na dole, aby zapisać ułożenie.</span>
          </div>
        </div>
      ) : null}

      {/* Top Controls Bar */}
      <div className="p-5 bg-steam-card border border-steam-border rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-steam-highlight" />
            <span>Krok 2: Ułóż biblioteki według preferencji</span>
          </h3>
          <p className="text-xs text-steam-textMuted mt-1 leading-relaxed max-w-2xl">
            System wstępnie dopasował kolejność na podstawie wskazanych gier. 
            Możesz jednym kliknięciem przenieść dowolną bibliotekę na wybrany poziom priorytetu (1, 2, 3 lub 4).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={handleResetToSuggested}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-steam-dark hover:bg-steam-navy border border-steam-border text-xs text-steam-textMuted hover:text-white transition-colors"
            title="Przywraca sugerowane rozłożenie na podstawie zaznaczonych gier"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sugerowane ułożenie</span>
          </button>

          <VotingRulesModal />
        </div>
      </div>

      {/* Tier Sections */}
      <div className="space-y-4">
        {tierConfigs.map((cfg) => {
          const tierAccounts = accounts.filter((a) => a.tier === cfg.tier);

          return (
            <div
              key={cfg.tier}
              className={`bg-steam-card/85 border ${cfg.borderClass} rounded-3xl p-4 sm:p-5 shadow-lg space-y-3 transition-all`}
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between gap-2 border-b border-steam-border/30 pb-2.5">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">{cfg.title}</h4>
                  <p className="text-[11px] text-steam-textMuted">{cfg.subtitle}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.badgeClass}`}>
                  {tierAccounts.length}
                </span>
              </div>

              {/* Accounts inside this Tier */}
              {tierAccounts.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-steam-dark/30 border border-dashed border-steam-border/40 text-center text-xs text-steam-textMuted">
                  Pusto na tym poziomie. Kliknij przycisk poziomu na karcie konta, aby je tu przenieść.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {tierAccounts.map((acc) => {
                    const anon = getAnonymousIdentity(acc.steamId);
                    const isExpanded = expandedMatchId === acc.steamId;

                    return (
                      <div
                        key={acc.steamId}
                        className="bg-steam-dark/90 border border-steam-border/60 rounded-2xl p-3 sm:p-3.5 hover:border-steam-borderHover transition-all space-y-2.5"
                      >
                        {/* Main row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Left: Avatar with Anonymous Animal Badge & Name */}
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`relative w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 border ${anon.borderClass} ${anon.bgClass}`}>
                              <span>{anon.emoji}</span>
                            </div>

                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-white text-sm truncate">
                                  {anon.name}
                                </h5>
                                <span className="text-[10px] text-steam-textMuted font-mono">
                                  ({acc.shareableGames} gier Share)
                                </span>
                              </div>

                              {/* Matches summary badge with toggle */}
                              <div className="flex items-center gap-2 mt-0.5">
                                {acc.matchedGamesCount > 0 ? (
                                  <button
                                    onClick={() => setExpandedMatchId(isExpanded ? null : acc.steamId)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-steam-highlight/10 hover:bg-steam-highlight/20 text-steam-highlight text-[11px] font-bold border border-steam-highlight/25 transition-colors"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Pasuje {acc.matchedGamesCount} Twoich gier</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-steam-textMuted">
                                    Brak wskazanych gier
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick Tier Switcher Buttons [1] [2] [3] [4] + Inspect */}
                          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                            {/* Inspect library */}
                            <button
                              onClick={() => {
                                setInspectSteamId(acc.steamId);
                                setInspectName(anon.name);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-steam-blue text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Przeglądaj wszystkie gry tej biblioteki"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Gry</span>
                            </button>

                            {/* Direct Tier Selector Pills */}
                            <div className="flex items-center p-1 rounded-xl bg-steam-navy border border-steam-border/60 gap-1">
                              {[
                                { t: 3, label: 'P1', full: 'Poziom 1 (Najwyższy)' },
                                { t: 2, label: 'P2', full: 'Poziom 2 (Wysoki)' },
                                { t: 1, label: 'P3', full: 'Poziom 3 (Umiarkowany)' },
                                { t: 0, label: 'P4', full: 'Poziom 4 (Neutralny)' },
                              ].map((btn) => {
                                const isCurrent = acc.tier === btn.t;
                                return (
                                  <button
                                    key={btn.t}
                                    onClick={() => handleSetTier(acc.steamId, btn.t)}
                                    className={`px-2 py-1 rounded-lg text-xs transition-all ${
                                      isCurrent
                                        ? btn.t === 3
                                          ? 'bg-steam-highlight text-steam-dark font-black shadow-sm'
                                          : btn.t === 2
                                          ? 'bg-steam-blue text-steam-dark font-black shadow-sm'
                                          : btn.t === 1
                                          ? 'bg-steam-green text-steam-dark font-black shadow-sm'
                                          : 'bg-steam-border text-white font-bold'
                                        : 'text-steam-textMuted hover:text-white hover:bg-steam-dark/50'
                                    }`}
                                    title={`Przenieś do ${btn.full}`}
                                  >
                                    {btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Matching Games Drawer */}
                        {isExpanded && acc.matchedGames.length > 0 && (
                          <div className="pt-2.5 border-t border-steam-border/40 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs text-steam-textMuted">
                              <span>Gry z tej biblioteki, które zaznaczyłeś:</span>
                              <button
                                onClick={() => setExpandedMatchId(null)}
                                className="text-steam-blue hover:underline text-[11px]"
                              >
                                Zwiń ▲
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                              {acc.matchedGames.map((g) => (
                                <div
                                  key={g.appId}
                                  className="flex items-center gap-2 p-2 rounded-xl bg-steam-card border border-steam-border/50"
                                >
                                  <div className="relative w-12 h-6 rounded bg-steam-dark overflow-hidden flex-shrink-0">
                                    <Image
                                      src={g.headerImage}
                                      alt={g.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  <div className="overflow-hidden flex-1">
                                    <span className="block text-xs font-semibold text-white truncate" title={g.name}>
                                      {g.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className={g.voterScore === 3 ? 'text-steam-highlight font-bold' : 'text-steam-blue font-semibold'}>
                                        {g.voterScore === 3 ? '⭐ Must-Have' : '👍 Chętnie'}
                                      </span>
                                      {g.priceFormatted && (
                                        <span className="text-steam-textMuted">{g.priceFormatted}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Prominent Save Choices Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-steam-card via-steam-navy to-steam-card border border-steam-highlight/50 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-white text-base flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-steam-highlight" />
            <span>Zapisz swoje preferencje bibliotek</span>
          </h4>
          <p className="text-xs text-steam-textMuted mt-1 max-w-xl">
            Kliknij poniższy przycisk, aby zapisać ułożoną listę. Preferencje zostaną uwzględnione przy tworzeniu optymalnego zestawu Steam Family.
          </p>
        </div>

        <button
          onClick={onSubmitBallot}
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          <BookmarkCheck className="w-5 h-5" />
          <span>
            {isSubmitting
              ? 'Zapisywanie...'
              : hasSubmittedBallot
              ? 'Zaktualizuj swoje wybory'
              : 'Zapisz moje wybory'}
          </span>
        </button>
      </div>
    </div>
  );
}
