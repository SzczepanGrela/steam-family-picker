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
        tier = 3; // Tier S
      } else if (idx < Math.max(2, Math.ceil(totalMatched * 0.70))) {
        tier = 2; // Tier A
      } else {
        tier = 1; // Tier B
      }
      return { ...acc, tier, rankOrder: idx };
    });

    const assignedUnmatched = unmatched.map((acc, idx) => ({
      ...acc,
      tier: 0, // Tier C
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
      tagColor: 'bg-amber-500 text-black font-black',
      title: '🌟 Tier S: Najwyższy Priorytet',
      subtitle: 'Biblioteki, które najbardziej chcesz mieć w rodzinie',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderClass: 'border-amber-500/40',
      activeGlowClass: 'ring-4 ring-amber-400 bg-amber-500/15 border-amber-400 scale-[1.01]',
    },
    {
      tier: 2,
      tag: 'TIER A',
      tagColor: 'bg-sky-500 text-black font-black',
      title: '👍 Tier A: Bardzo Chętnie',
      subtitle: 'Wartościowe biblioteki z grami, w które chętnie zagrasz',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      borderClass: 'border-sky-500/40',
      activeGlowClass: 'ring-4 ring-sky-400 bg-sky-500/15 border-sky-400 scale-[1.01]',
    },
    {
      tier: 1,
      tag: 'TIER B',
      tagColor: 'bg-emerald-500 text-black font-black',
      title: '👌 Tier B: Dobre Uzupełnienie',
      subtitle: 'Pozycje uzupełniające pulę tytułów',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      borderClass: 'border-emerald-500/40',
      activeGlowClass: 'ring-4 ring-emerald-400 bg-emerald-500/15 border-emerald-400 scale-[1.01]',
    },
    {
      tier: 0,
      tag: 'TIER C',
      tagColor: 'bg-slate-700 text-slate-200 font-bold',
      title: '➖ Tier C: Pozostałe / Neutralne',
      subtitle: 'Brak szczególnych preferencji wobec tych kont',
      badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
      borderClass: 'border-slate-700/50',
      activeGlowClass: 'ring-4 ring-slate-400 bg-slate-700/30 border-slate-400 scale-[1.01]',
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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-[2px] z-30 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Unsaved changes alert */}
      {hasUnsavedChanges && (
        <div className="relative z-40 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 font-bold flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Masz niezapisane zmiany w rankingu. Kliknij przycisk zapisu na dole.</span>
          </div>
          <button
            onClick={onSubmitBallot}
            disabled={isSubmitting}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-sm whitespace-nowrap active:scale-95"
          >
            Zapisz teraz
          </button>
        </div>
      )}

      {/* Clean Toolbar */}
      <div className="relative z-40 flex items-center justify-between gap-3 p-3.5 bg-steam-card border border-steam-border/70 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Layers className="w-4 h-4 text-steam-highlight" />
          <span>Przeciągaj kafelki między poziomami lub zmieniaj ich kolejność w boksie</span>
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
              className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                isTargeted
                  ? cfg.activeGlowClass
                  : isDraggingActive
                  ? `${cfg.borderClass} bg-steam-card/95 shadow-2xl border-dashed`
                  : `${cfg.borderClass} bg-steam-card/85 shadow-md`
              }`}
            >
              {/* Tier Header Bar (TierMaker Style Tag) */}
              <div className="flex items-center justify-between p-2.5 sm:px-4 sm:py-2.5 bg-steam-dark/90 border-b border-steam-border/30">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wider shadow-sm ${cfg.tagColor}`}>
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
                  <div className={`py-4 px-3 rounded-xl border-2 border-dashed text-center text-xs transition-colors ${
                    isTargeted ? 'border-amber-400/80 bg-amber-500/10 text-amber-200 font-bold' : 'border-steam-border/30 text-steam-textMuted'
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

                      return (
                        <div
                          key={acc.steamId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, acc.steamId)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleCardDragOver(e, acc.steamId, cfg.tier)}
                          onDragLeave={(e) => handleCardDragLeave(e, acc.steamId)}
                          onDrop={(e) => handleCardDrop(e, acc.steamId, cfg.tier)}
                          className={`relative group select-none cursor-grab active:cursor-grabbing rounded-xl p-2.5 border transition-all duration-150 ${
                            isThisDragging
                              ? 'opacity-30 scale-95 border-amber-400 bg-amber-500/20'
                              : isOverThisCard
                              ? dragDropPosition === 'before'
                                ? 'border-l-4 border-l-amber-400 bg-steam-dark/95 border-steam-border shadow-lg -translate-x-0.5'
                                : 'border-r-4 border-r-amber-400 bg-steam-dark/95 border-steam-border shadow-lg translate-x-0.5'
                              : 'bg-steam-dark/90 border-steam-border/60 hover:border-steam-borderHover hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Grip handle + Avatar + Name */}
                            <div className="flex items-center gap-2 overflow-hidden">
                              <GripVertical className="w-3.5 h-3.5 text-steam-textMuted group-hover:text-white flex-shrink-0" />
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border ${anon.borderClass} ${anon.bgClass}`}>
                                <span>{anon.emoji}</span>
                              </div>

                              <div className="overflow-hidden">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs truncate">
                                    {anon.name}
                                  </span>
                                  <span className="text-[10px] text-steam-textMuted font-mono">
                                    ({acc.shareableGames})
                                  </span>
                                </div>

                                {acc.matchedGamesCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedMatchId(isExpanded ? null : acc.steamId)}
                                    className="inline-flex items-center gap-1 text-steam-highlight hover:underline text-[10px] font-bold mt-0.5"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>{acc.matchedGamesCount} Twoich gier</span>
                                    {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-steam-textMuted block mt-0.5">
                                    Brak gier
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
                              className="p-1.5 rounded-lg bg-steam-navy hover:bg-steam-card border border-steam-border text-steam-blue text-[11px] font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
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
                                    <span className={`text-[9px] font-bold ${g.voterScore === 3 ? 'text-steam-highlight' : 'text-steam-blue'}`}>
                                      {g.voterScore === 3 ? '⭐ Must' : '👍 Chcę'}
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
      <div className="relative z-40 p-4 bg-steam-card border border-steam-highlight/40 rounded-2xl shadow-xl flex items-center justify-between gap-3">
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
