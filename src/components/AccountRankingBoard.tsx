'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  Layers, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookmarkCheck
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
  tier: number; // 3 (Poziom 1), 2 (Poziom 2), 1 (Poziom 3), 0 (Poziom 4)
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

  matched.sort((a, b) => b.matchScore - a.matchScore || b.shareableGames - a.shareableGames);
  unmatched.sort((a, b) => b.shareableGames - a.shareableGames);

  if (matched.length > 0) {
    const totalMatched = matched.length;
    const assignedMatched = matched.map((acc, idx) => {
      let tier = 1;
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
      tier: 0, // Poziom 4 (Pozostałe)
      rankOrder: assignedMatched.length + idx,
    }));

    return [...assignedMatched, ...assignedUnmatched];
  } else {
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

  const handleResetToSuggested = () => {
    const baseList = initialAccounts.length > 0 ? initialAccounts : accounts;
    const suggested = computeSmartGradation(baseList);
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
      title: '🌟 Poziom 1: Najwyższy Priorytet',
      badgeClass: 'bg-steam-highlight/20 text-steam-highlight border-steam-highlight/40',
      borderClass: 'border-steam-highlight/40',
    },
    {
      tier: 2,
      title: '👍 Poziom 2: Wysoki Priorytet',
      badgeClass: 'bg-steam-blue/20 text-steam-blue border-steam-blue/40',
      borderClass: 'border-steam-blue/30',
    },
    {
      tier: 1,
      title: '👌 Poziom 3: Umiarkowany Priorytet',
      badgeClass: 'bg-steam-green/20 text-steam-green border-steam-green/40',
      borderClass: 'border-steam-green/30',
    },
    {
      tier: 0,
      title: '➖ Poziom 4: Pozostałe / Neutralne',
      badgeClass: 'bg-steam-border/30 text-steam-textMuted border-steam-border/50',
      borderClass: 'border-steam-border/30',
    },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      <AccountLibraryModal
        steamId={inspectSteamId}
        accountName={inspectName}
        onClose={() => setInspectSteamId(null)}
      />

      {/* Unsaved changes alert (only shown when user actually clicked/changed something) */}
      {hasUnsavedChanges && (
        <div className="p-3.5 rounded-2xl bg-yellow-500/15 border border-yellow-500/40 text-xs text-steam-highlight font-bold flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Masz niezapisane zmiany w rankingu. Kliknij przycisk zapisu na dole.</span>
          </div>
          <button
            onClick={onSubmitBallot}
            disabled={isSubmitting}
            className="px-3 py-1 bg-steam-highlight text-steam-dark font-black rounded-xl text-xs shadow-sm hover:bg-yellow-400 whitespace-nowrap active:scale-95"
          >
            Zapisz teraz
          </button>
        </div>
      )}

      {/* Clean Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-steam-card border border-steam-border/70 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Layers className="w-4 h-4 text-steam-highlight" />
          <span>Dopasuj ułożenie bibliotek (kliknij P1–P4)</span>
        </div>

        <button
          onClick={handleResetToSuggested}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-steam-dark hover:bg-steam-navy border border-steam-border/60 text-xs text-steam-textMuted hover:text-white transition-colors"
          title="Przywraca sugerowany układ na podstawie wybranych gier"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sugerowane</span>
        </button>
      </div>

      {/* 4 Clean Tier Blocks */}
      <div className="space-y-3.5">
        {tierConfigs.map((cfg) => {
          const tierAccounts = accounts.filter((a) => a.tier === cfg.tier);

          return (
            <div
              key={cfg.tier}
              className={`bg-steam-card/75 border ${cfg.borderClass} rounded-2xl p-3.5 shadow-md space-y-2.5 transition-all`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-steam-border/30 pb-2">
                <span className="font-bold text-white text-xs sm:text-sm">{cfg.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.badgeClass}`}>
                  {tierAccounts.length}
                </span>
              </div>

              {/* Accounts List */}
              {tierAccounts.length === 0 ? (
                <div className="py-2 px-3 rounded-xl bg-steam-dark/20 border border-dashed border-steam-border/30 text-center text-[11px] text-steam-textMuted">
                  Pusto. Kliknij P{cfg.tier === 3 ? 1 : cfg.tier === 2 ? 2 : cfg.tier === 1 ? 3 : 4} na dowolnej bibliotece, aby ją tu przenieść.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {tierAccounts.map((acc) => {
                    const anon = getAnonymousIdentity(acc.steamId);
                    const isExpanded = expandedMatchId === acc.steamId;

                    return (
                      <div
                        key={acc.steamId}
                        className="bg-steam-dark/85 border border-steam-border/50 rounded-xl p-2.5 sm:p-3 hover:border-steam-borderHover transition-all space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          {/* Avatar & Name */}
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 border ${anon.borderClass} ${anon.bgClass}`}>
                              <span>{anon.emoji}</span>
                            </div>

                            <div className="overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs sm:text-sm truncate">
                                  {anon.name}
                                </span>
                                <span className="text-[10px] text-steam-textMuted font-mono">
                                  ({acc.shareableGames} gier)
                                </span>
                              </div>

                              {/* Matches badge */}
                              {acc.matchedGamesCount > 0 ? (
                                <button
                                  onClick={() => setExpandedMatchId(isExpanded ? null : acc.steamId)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-steam-highlight/10 hover:bg-steam-highlight/20 text-steam-highlight text-[10px] font-bold border border-steam-highlight/20 transition-colors mt-0.5"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Pasuje {acc.matchedGamesCount} gier</span>
                                  {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                </button>
                              ) : (
                                <span className="text-[10px] text-steam-textMuted block mt-0.5">
                                  Brak wskazanych gier
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: [Gry] + [P1] [P2] [P3] [P4] */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                            <button
                              onClick={() => {
                                setInspectSteamId(acc.steamId);
                                setInspectName(anon.name);
                              }}
                              className="px-2 py-1 rounded-lg bg-steam-navy hover:bg-steam-card border border-steam-border text-steam-blue text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Przeglądaj wszystkie gry tej biblioteki"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Gry</span>
                            </button>

                            {/* Direct Tier Selector Pills */}
                            <div className="flex items-center p-0.5 rounded-lg bg-steam-navy border border-steam-border/60 gap-0.5">
                              {[
                                { t: 3, label: 'P1' },
                                { t: 2, label: 'P2' },
                                { t: 1, label: 'P3' },
                                { t: 0, label: 'P4' },
                              ].map((btn) => {
                                const isCurrent = acc.tier === btn.t;
                                return (
                                  <button
                                    key={btn.t}
                                    onClick={() => handleSetTier(acc.steamId, btn.t)}
                                    className={`px-2 py-1 rounded text-[11px] transition-all ${
                                      isCurrent
                                        ? btn.t === 3
                                          ? 'bg-steam-highlight text-steam-dark font-black'
                                          : btn.t === 2
                                          ? 'bg-steam-blue text-steam-dark font-black'
                                          : btn.t === 1
                                          ? 'bg-steam-green text-steam-dark font-black'
                                          : 'bg-steam-border text-white font-bold'
                                        : 'text-steam-textMuted hover:text-white hover:bg-steam-dark/50'
                                    }`}
                                  >
                                    {btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Matches Drawer */}
                        {isExpanded && acc.matchedGames.length > 0 && (
                          <div className="pt-2 border-t border-steam-border/30 space-y-1.5 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                              {acc.matchedGames.map((g) => (
                                <div
                                  key={g.appId}
                                  className="flex items-center gap-2 p-1.5 rounded-lg bg-steam-card border border-steam-border/40"
                                >
                                  <div className="relative w-10 h-5 rounded bg-steam-dark overflow-hidden flex-shrink-0">
                                    <Image
                                      src={g.headerImage}
                                      alt={g.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  <div className="overflow-hidden flex-1">
                                    <span className="block text-[11px] font-semibold text-white truncate" title={g.name}>
                                      {g.name}
                                    </span>
                                    <span className={`text-[9px] font-bold ${g.voterScore === 3 ? 'text-steam-highlight' : 'text-steam-blue'}`}>
                                      {g.voterScore === 3 ? '⭐ Must-Have' : '👍 Chętnie'}
                                    </span>
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

      {/* Floating or Bottom Save Bar */}
      <div className="p-4 bg-steam-card border border-steam-highlight/40 rounded-2xl shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-steam-text">
          <BookmarkCheck className="w-4 h-4 text-steam-highlight flex-shrink-0" />
          <span className="hidden sm:inline">
            {hasSubmittedBallot ? 'Twoje wybory są zapisane w systemie.' : 'Ułożyłeś biblioteki? Zapisz swój wybór.'}
          </span>
        </div>

        <button
          onClick={onSubmitBallot}
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>
            {isSubmitting
              ? 'Zapisywanie...'
              : hasSubmittedBallot
              ? 'Zaktualizuj wybory'
              : 'Zapisz moje wybory'}
          </span>
        </button>
      </div>
    </div>
  );
}
