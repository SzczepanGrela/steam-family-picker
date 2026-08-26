'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  Layers, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  AlertTriangle, 
  BookmarkCheck,
  GripVertical
} from 'lucide-react';
import AccountLibraryModal from './AccountLibraryModal';
import { getAnonymousIdentity } from '@/lib/anonymous';

export interface AccountWithMatches {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
  totalGames: number;
  shareableGames: number;
  tier: number; // 3 (Tier S), 2 (Tier A), 1 (Tier B), 0 (Tier C)
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

  // 1. Build a global dictionary of all desired games and their voter weight (3 for Must-Have, 1 for Interested)
  const allDesiredGames = new Map<number, number>();
  for (const acc of accountsList) {
    for (const g of acc.matchedGames || []) {
      const currentWeight = allDesiredGames.get(g.appId) || 0;
      if (g.voterScore > currentWeight) {
        allDesiredGames.set(g.appId, g.voterScore);
      }
    }
  }

  // If user selected no matching games, fallback to sorting by shareableGames
  if (allDesiredGames.size === 0) {
    const allSorted = [...accountsList].sort((a, b) => b.shareableGames - a.shareableGames);
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

  // 2. Greedy Set Cover: iteratively pick the account that provides the highest MARGINAL coverage of remaining uncovered games
  const uncoveredAppIds = new Set<number>(allDesiredGames.keys());
  let remainingCandidates = [...accountsList];
  const greedyOrdered: Array<{ account: AccountWithMatches; marginalGain: number; rawScore: number }> = [];

  while (remainingCandidates.length > 0) {
    let bestCandidateIndex = -1;
    let bestMarginalGain = -1;
    let bestRawScore = -1;
    let bestShareableGames = -1;

    for (let i = 0; i < remainingCandidates.length; i++) {
      const cand = remainingCandidates[i];
      let candMarginalGain = 0;
      let candRawScore = 0;

      for (const g of cand.matchedGames || []) {
        const weight = allDesiredGames.get(g.appId) || (g.voterScore === 3 ? 3 : 1);
        candRawScore += weight;
        if (uncoveredAppIds.has(g.appId)) {
          candMarginalGain += weight;
        }
      }

      // Tie-breakers: higher marginal gain > higher shareable games > higher raw score
      if (
        candMarginalGain > bestMarginalGain ||
        (candMarginalGain === bestMarginalGain && cand.shareableGames > bestShareableGames) ||
        (candMarginalGain === bestMarginalGain && cand.shareableGames === bestShareableGames && candRawScore > bestRawScore)
      ) {
        bestMarginalGain = candMarginalGain;
        bestRawScore = candRawScore;
        bestShareableGames = cand.shareableGames;
        bestCandidateIndex = i;
      }
    }

    if (bestCandidateIndex >= 0) {
      const chosen = remainingCandidates[bestCandidateIndex];
      greedyOrdered.push({
        account: chosen,
        marginalGain: bestMarginalGain,
        rawScore: bestRawScore,
      });

      // Remove games provided by this chosen account from uncovered set
      for (const g of chosen.matchedGames || []) {
        uncoveredAppIds.delete(g.appId);
      }

      remainingCandidates.splice(bestCandidateIndex, 1);
    } else {
      break;
    }
  }

  // 3. Assign tiers:
  // - Top unique contributors (marginal gain > 0) -> Tier S / Tier A
  // - Secondary / full overlap with matching games -> Tier B
  // - Zero matches -> Tier C
  const uniqueContributors = greedyOrdered.filter((item) => item.marginalGain > 0);
  const overlappingOrZero = greedyOrdered.filter((item) => item.marginalGain === 0);

  const totalContributors = uniqueContributors.length;
  const result: AccountWithMatches[] = [];

  uniqueContributors.forEach((item, idx) => {
    let tier = 1;
    if (idx < Math.max(1, Math.ceil(totalContributors * 0.4))) {
      tier = 3; // Tier S
    } else if (idx < Math.max(2, Math.ceil(totalContributors * 0.8))) {
      tier = 2; // Tier A
    } else {
      tier = 1; // Tier B
    }
    result.push({
      ...item.account,
      tier,
      rankOrder: result.length,
    });
  });

  overlappingOrZero.forEach((item) => {
    const hasAnyMatches = (item.account.matchedGames || []).length > 0;
    const tier = hasAnyMatches ? 1 : 0; // Tier B if matches overlap with earlier accounts, Tier C if 0 matches
    result.push({
      ...item.account,
      tier,
      rankOrder: result.length,
    });
  });

  return result;
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

  // Drag and Drop state
  const [draggingSteamId, setDraggingSteamId] = useState<string | null>(null);
  const [activeDropTier, setActiveDropTier] = useState<number | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [dragDropPosition, setDragDropPosition] = useState<'before' | 'after'>('before');

  // Auto-scroll while dragging near viewport edges
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = (direction: 'up' | 'down') => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      window.scrollBy({ top: direction === 'up' ? -18 : 18, behavior: 'auto' });
    }, 20);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAutoScroll();
  }, []);

  const checkAutoScroll = (clientY: number) => {
    const threshold = 140;
    if (clientY < threshold) {
      startAutoScroll('up');
    } else if (clientY > window.innerHeight - threshold) {
      startAutoScroll('down');
    } else {
      stopAutoScroll();
    }
  };

  const handleDragStart = (e: React.DragEvent, steamId: string) => {
    setDraggingSteamId(steamId);
    e.dataTransfer.setData('text/plain', steamId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingSteamId(null);
    setActiveDropTier(null);
    setDragOverCardId(null);
    stopAutoScroll();
  };

  const handleDragOverContainer = (e: React.DragEvent, tierNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropTier !== tierNum) {
      setActiveDropTier(tierNum);
    }
    checkAutoScroll(e.clientY);
  };

  const handleCardDragOver = (e: React.DragEvent, targetSteamId: string, tierNum: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    setActiveDropTier(tierNum);
    checkAutoScroll(e.clientY);

    if (targetSteamId === draggingSteamId) {
      setDragOverCardId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const position = e.clientX < midX ? 'before' : 'after';

    setDragOverCardId(targetSteamId);
    setDragDropPosition(position);
  };

  const handleCardDragLeave = (e: React.DragEvent, targetSteamId: string) => {
    if (dragOverCardId === targetSteamId) {
      setDragOverCardId(null);
    }
  };

  // Drop on a specific card (reordering within box or across boxes)
  const handleCardDrop = (e: React.DragEvent, targetSteamId: string, targetTier: number) => {
    e.preventDefault();
    e.stopPropagation();
    stopAutoScroll();

    const sourceSteamId = e.dataTransfer.getData('text/plain') || draggingSteamId;
    if (!sourceSteamId || sourceSteamId === targetSteamId) {
      handleDragEnd();
      return;
    }

    const sourceIdx = accounts.findIndex((a) => a.steamId === sourceSteamId);
    if (sourceIdx === -1) {
      handleDragEnd();
      return;
    }

    const draggedAccount = { ...accounts[sourceIdx], tier: targetTier };
    const remaining = accounts.filter((a) => a.steamId !== sourceSteamId);

    const targetIdxInRemaining = remaining.findIndex((a) => a.steamId === targetSteamId);
    if (targetIdxInRemaining === -1) {
      handleDragEnd();
      return;
    }

    const insertIdx = dragDropPosition === 'before' ? targetIdxInRemaining : targetIdxInRemaining + 1;
    remaining.splice(insertIdx, 0, draggedAccount);

    const normalized = remaining.map((a, idx) => ({ ...a, rankOrder: idx }));
    onAccountsChange(normalized);
    handleDragEnd();
  };

  // Drop on the container background (appends to that tier)
  const handleContainerDrop = (e: React.DragEvent, targetTier: number) => {
    e.preventDefault();
    stopAutoScroll();

    const sourceSteamId = e.dataTransfer.getData('text/plain') || draggingSteamId;
    if (!sourceSteamId) {
      handleDragEnd();
      return;
    }

    const sourceIdx = accounts.findIndex((a) => a.steamId === sourceSteamId);
    if (sourceIdx === -1) {
      handleDragEnd();
      return;
    }

    const draggedAccount = { ...accounts[sourceIdx], tier: targetTier };
    const remaining = accounts.filter((a) => a.steamId !== sourceSteamId);

    // Find the last index of targetTier in remaining, or appropriate position
    let insertIdx = remaining.length;
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i].tier >= targetTier) {
        insertIdx = i + 1;
        break;
      }
    }

    remaining.splice(insertIdx, 0, draggedAccount);
    const normalized = remaining.map((a, idx) => ({ ...a, rankOrder: idx }));

    onAccountsChange(normalized);
    handleDragEnd();
  };

  const handleResetToSuggested = () => {
    const baseList = initialAccounts.length > 0 ? initialAccounts : accounts;
    const suggested = computeSmartGradation(baseList);
    onAccountsChange(suggested);
  };

  const tierConfigs = [
    {
      tier: 3,
      tag: 'TIER S',
      tagColor: 'bg-amber-400 text-stone-950 font-black',
      title: '🌟 Tier S: Najwyższy Priorytet',
      subtitle: 'Biblioteki, które najbardziej chcesz mieć w rodzinie',
      badgeClass: 'bg-amber-400/10 text-amber-300 border-amber-500/30',
      borderClass: 'border-amber-500/30',
      activeGlowClass: 'ring-2 ring-amber-400/80 bg-amber-400/5 border-amber-400/80 scale-[1.005]',
      accentColor: 'text-amber-300',
    },
    {
      tier: 2,
      tag: 'TIER A',
      tagColor: 'bg-sky-400 text-stone-950 font-black',
      title: '👍 Tier A: Bardzo Chętnie',
      subtitle: 'Wartościowe biblioteki z grami, w które chętnie zagrasz',
      badgeClass: 'bg-sky-400/10 text-sky-300 border-sky-500/30',
      borderClass: 'border-sky-500/30',
      activeGlowClass: 'ring-2 ring-sky-400/80 bg-sky-400/5 border-sky-400/80 scale-[1.005]',
      accentColor: 'text-sky-300',
    },
    {
      tier: 1,
      tag: 'TIER B',
      tagColor: 'bg-emerald-400 text-stone-950 font-black',
      title: '👌 Tier B: Dobre Uzupełnienie',
      subtitle: 'Pozycje uzupełniające pulę tytułów',
      badgeClass: 'bg-emerald-400/10 text-emerald-300 border-emerald-500/30',
      borderClass: 'border-emerald-500/30',
      activeGlowClass: 'ring-2 ring-emerald-400/80 bg-emerald-400/5 border-emerald-400/80 scale-[1.005]',
      accentColor: 'text-emerald-300',
    },
    {
      tier: 0,
      tag: 'TIER C',
      tagColor: 'bg-slate-700 text-slate-200 font-bold',
      title: '➖ Tier C: Pozostałe / Neutralne',
      subtitle: 'Brak szczególnych preferencji wobec tych kont',
      badgeClass: 'bg-slate-700/30 text-slate-400 border-slate-700/40',
      borderClass: 'border-slate-700/40',
      activeGlowClass: 'ring-2 ring-slate-400/80 bg-slate-700/20 border-slate-400/80 scale-[1.005]',
      accentColor: 'text-slate-400',
    },
  ];

  const isDraggingActive = draggingSteamId !== null;

  return (
    <div className="relative space-y-4 animate-fadeIn">
      <AccountLibraryModal
        steamId={inspectSteamId}
        accountName={inspectName}
        onClose={() => setInspectSteamId(null)}
      />

      {/* Dimmed Background Overlay when Dragging Active */}
      {isDraggingActive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-30 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Clean Toolbar */}
      <div className="relative z-40 flex items-center justify-between gap-3 p-3.5 bg-steam-card border border-steam-border/60 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Layers className="w-4 h-4 text-steam-blue" />
          <span>Przeciągaj kafelki między poziomami lub zmieniaj kolejność w boksie</span>
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

      {/* 4 Interactive Tier Boxes */}
      <div className="relative z-40 space-y-3.5">
        {tierConfigs.map((cfg) => {
          const tierAccounts = accounts.filter((a) => a.tier === cfg.tier);
          const isTargeted = activeDropTier === cfg.tier;

          return (
            <div
              key={cfg.tier}
              onDragOver={(e) => handleDragOverContainer(e, cfg.tier)}
              onDragEnter={(e) => handleDragOverContainer(e, cfg.tier)}
              onDrop={(e) => handleContainerDrop(e, cfg.tier)}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isTargeted
                  ? cfg.activeGlowClass
                  : isDraggingActive
                  ? `${cfg.borderClass} bg-steam-card/95 shadow-2xl border-dashed`
                  : `${cfg.borderClass} bg-steam-card/75 shadow-md`
              }`}
            >
              {/* Tier Header Bar */}
              <div className="flex items-center justify-between p-2.5 sm:px-4 sm:py-2.5 bg-steam-dark/80 border-b border-steam-border/30">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider shadow-sm ${cfg.tagColor}`}>
                    {cfg.tag}
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm">{cfg.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.badgeClass}`}>
                  {tierAccounts.length}
                </span>
              </div>

              {/* Tier Drop Zone */}
              <div className="p-3 min-h-[76px] transition-colors">
                {tierAccounts.length === 0 ? (
                  <div className={`py-4 px-3 rounded-xl border border-dashed text-center text-xs transition-colors ${
                    isTargeted ? 'border-sky-400/60 bg-sky-500/10 text-sky-200 font-bold' : 'border-steam-border/30 text-steam-textMuted'
                  }`}>
                    {isTargeted ? 'Upuść tutaj, aby dodać do tego poziomu' : 'Przeciągnij tutaj bibliotekę'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {tierAccounts.map((acc) => {
                      const anon = getAnonymousIdentity(acc.steamId);
                      const isExpanded = expandedMatchId === acc.steamId;
                      const isThisDragging = draggingSteamId === acc.steamId;
                      const isOverThisCard = dragOverCardId === acc.steamId && !isThisDragging;

                      const mustCount = (acc.matchedGames || []).filter((g) => g.voterScore === 3).length;
                      const interestedCount = (acc.matchedGames || []).filter((g) => g.voterScore === 1).length;

                      return (
                        <div
                          key={acc.steamId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, acc.steamId)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleCardDragOver(e, acc.steamId, cfg.tier)}
                          onDragLeave={(e) => handleCardDragLeave(e, acc.steamId)}
                          onDrop={(e) => handleCardDrop(e, acc.steamId, cfg.tier)}
                          className={`relative group select-none cursor-grab active:cursor-grabbing rounded-xl p-3 border transition-all duration-150 ${
                            isThisDragging
                              ? 'opacity-25 scale-95 border-sky-400 bg-sky-500/10'
                              : isOverThisCard
                              ? dragDropPosition === 'before'
                                ? 'border-l-4 border-l-sky-400 bg-steam-dark/95 border-steam-border shadow-lg -translate-x-0.5'
                                : 'border-r-4 border-r-sky-400 bg-steam-dark/95 border-steam-border shadow-lg translate-x-0.5'
                              : 'bg-steam-dark/85 border-steam-border/50 hover:border-steam-borderHover hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            {/* Grip + Avatar + Info */}
                            <div className="flex items-start gap-2.5 overflow-hidden">
                              <GripVertical className="w-3.5 h-3.5 text-steam-textMuted group-hover:text-white flex-shrink-0 mt-1" />
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 border ${anon.borderClass} ${anon.bgClass}`}>
                                <span>{anon.emoji}</span>
                              </div>

                              <div className="overflow-hidden space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs truncate">
                                    {anon.name}
                                  </span>
                                  <span className="text-[10px] text-steam-textMuted font-mono">
                                    ({acc.shareableGames} gier Share)
                                  </span>
                                </div>

                                {/* Matches breakdown */}
                                {acc.matchedGamesCount > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedMatchId(isExpanded ? null : acc.steamId)}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-steam-blue/10 hover:bg-steam-blue/20 text-steam-blue text-[10px] font-bold border border-steam-blue/30 transition-colors"
                                      title="Rozwiń listę dopasowanych gier"
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>{acc.matchedGamesCount} wybranych</span>
                                      {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                    </button>

                                    {mustCount > 0 && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[9px] font-bold border border-amber-500/25">
                                        ⭐ {mustCount} Must
                                      </span>
                                    )}

                                    {interestedCount > 0 && (
                                      <span className="px-1.5 py-0.5 rounded bg-sky-400/10 text-sky-300 text-[9px] font-bold border border-sky-500/25">
                                        👍 {interestedCount} Chętnie
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-steam-textMuted block">
                                    0 Twoich wybranych tytułów
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Inspect library button */}
                            <button
                              type="button"
                              onClick={() => {
                                setInspectSteamId(acc.steamId);
                                setInspectName(anon.name);
                              }}
                              className="p-1.5 px-2 rounded-lg bg-steam-navy hover:bg-steam-card border border-steam-border text-steam-blue text-[11px] font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                              title="Przeglądaj wszystkie gry tej biblioteki"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="text-[10px]">Gry</span>
                            </button>
                          </div>

                          {/* Matching games drawer */}
                          {isExpanded && acc.matchedGames.length > 0 && (
                            <div className="pt-2 mt-2 border-t border-steam-border/30 space-y-1 animate-fadeIn">
                              <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                                {acc.matchedGames.map((g) => (
                                  <div
                                    key={g.appId}
                                    className="flex items-center gap-1.5 p-1 rounded bg-steam-card/80 border border-steam-border/40"
                                  >
                                    <div className="relative w-8 h-4 rounded bg-steam-dark overflow-hidden flex-shrink-0">
                                      <Image
                                        src={g.headerImage}
                                        alt={g.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                    <span className="block text-[10px] font-medium text-white truncate flex-1" title={g.name}>
                                      {g.name}
                                    </span>
                                    <span className={`text-[9px] font-bold ${g.voterScore === 3 ? 'text-amber-300' : 'text-sky-300'}`}>
                                      {g.voterScore === 3 ? '⭐ Must' : '👍 Chętnie'}
                                    </span>
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
            </div>
          );
        })}
      </div>

      {/* Bottom Save Bar */}
      <div className="relative z-40 p-3.5 sm:p-4 bg-steam-card border border-steam-border rounded-2xl shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-steam-text">
          <BookmarkCheck className="w-4 h-4 text-steam-blue flex-shrink-0" />
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
