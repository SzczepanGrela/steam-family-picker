'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Gamepad2, 
  Check, 
  Layers, 
  Search, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Star,
  ThumbsUp,
  ExternalLink,
  ShieldAlert
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

interface AccountRankingBoardProps {
  initialAccounts: AccountWithMatches[];
  onSavePreferences: (prefs: Array<{ targetSteamId: string; tier: number; rankOrder: number }>) => Promise<void>;
  isSaving?: boolean;
}

export default function AccountRankingBoard({
  initialAccounts,
  onSavePreferences,
  isSaving,
}: AccountRankingBoardProps) {
  const [accounts, setAccounts] = useState<AccountWithMatches[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [inspectSteamId, setInspectSteamId] = useState<string | null>(null);
  const [inspectName, setInspectName] = useState<string>('');
  const [saveStatusText, setSaveStatusText] = useState<string>('Zapisano');

  const isInitializedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize accounts with smart proportional suggestion once
  useEffect(() => {
    if (initialAccounts.length === 0) return;

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;

      // Check if user already had custom saved tiers
      const hasCustomTiers = initialAccounts.some((a) => a.tier > 0);

      if (hasCustomTiers) {
        const sorted = [...initialAccounts].sort((a, b) => {
          if (b.tier !== a.tier) return b.tier - a.tier;
          return a.rankOrder - b.rankOrder;
        });
        setAccounts(sorted);
      } else {
        // Smart Proportional Gradation Algorithm
        // Score based on Must-Have (3x), Interested (1x) and library size
        const scored = [...initialAccounts].map((acc) => {
          const mustCount = acc.matchedGames.filter((g) => g.voterScore === 3).length;
          const interestedCount = acc.matchedGames.filter((g) => g.voterScore === 1).length;
          const matchScore = mustCount * 3 + interestedCount * 1 + acc.shareableGames * 0.001;
          return { ...acc, matchScore };
        });

        scored.sort((a, b) => b.matchScore - a.matchScore || b.shareableGames - a.shareableGames);

        // Distribute proportionally into Tiers 3, 2, 1, 0
        const total = scored.length;
        const withTiers = scored.map((acc, index) => {
          let assignedTier = 0;
          if (acc.matchScore > 0) {
            if (index < Math.ceil(total * 0.25) || index === 0) {
              assignedTier = 3; // Poziom 1 (Najwyższy)
            } else if (index < Math.ceil(total * 0.60)) {
              assignedTier = 2; // Poziom 2 (Wysoki)
            } else {
              assignedTier = 1; // Poziom 3 (Umiarkowany)
            }
          } else {
            assignedTier = 0; // Neutralny
          }
          return { ...acc, tier: assignedTier, rankOrder: index };
        });

        setAccounts(withTiers);

        // Debounced save of initial suggestion
        onSavePreferences(
          withTiers.map((a, i) => ({
            targetSteamId: a.steamId,
            tier: a.tier,
            rankOrder: i,
          }))
        );
      }
    }
  }, [initialAccounts, onSavePreferences]);

  // Debounced save triggered ONLY on explicit user interactions
  const triggerSave = useCallback(
    (updated: AccountWithMatches[]) => {
      setSaveStatusText('Zapisywanie...');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSavePreferences(
            updated.map((a, i) => ({
              targetSteamId: a.steamId,
              tier: a.tier,
              rankOrder: i,
            }))
          );
          setSaveStatusText('Zapisano');
        } catch {
          setSaveStatusText('Błąd zapisu');
        }
      }, 500);
    },
    [onSavePreferences]
  );

  const handleMoveTier = (steamId: string, delta: number) => {
    const updated = accounts.map((acc) => {
      if (acc.steamId === steamId) {
        const newTier = Math.max(0, Math.min(3, acc.tier + delta));
        return { ...acc, tier: newTier };
      }
      return acc;
    });
    setAccounts(updated);
    triggerSave(updated);
  };

  const handleSetTier = (steamId: string, tier: number) => {
    const updated = accounts.map((acc) => (acc.steamId === steamId ? { ...acc, tier } : acc));
    setAccounts(updated);
    triggerSave(updated);
  };

  const tierConfigs = [
    {
      tier: 3,
      title: '🌟 Poziom 1: Najwyższy Priorytet (Bardzo chcę)',
      subtitle: 'Konta, które chcesz mieć w rodzinie w pierwszej kolejności',
      badgeClass: 'bg-steam-highlight/20 text-steam-highlight border-steam-highlight/40',
      borderClass: 'border-steam-highlight/50',
    },
    {
      tier: 2,
      title: '👍 Poziom 2: Wysoki Priorytet (Chętnie)',
      subtitle: 'Wartościowe biblioteki z grami, w które chętnie zagrasz',
      badgeClass: 'bg-steam-blue/20 text-steam-blue border-steam-blue/40',
      borderClass: 'border-steam-blue/40',
    },
    {
      tier: 1,
      title: '👌 Poziom 3: Umiarkowany Priorytet (Może być)',
      subtitle: 'Dobre pozycje uzupełniające pulę',
      badgeClass: 'bg-steam-green/20 text-steam-green border-steam-green/40',
      borderClass: 'border-steam-green/40',
    },
    {
      tier: 0,
      title: '➖ Poziom 4: Neutralne / Na równi z resztą',
      subtitle: 'Brak szczególnych preferencji wobec tych kont',
      badgeClass: 'bg-steam-border/30 text-steam-textMuted border-steam-border/50',
      borderClass: 'border-steam-border/40',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <AccountLibraryModal
        steamId={inspectSteamId}
        accountName={inspectName}
        onClose={() => setInspectSteamId(null)}
      />

      {/* Intro & Live Save Status Bar */}
      <div className="p-5 bg-steam-card border border-steam-border rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-steam-highlight" />
            <span>Krok 2: Ułóż Ranking Bibliotek Graczy</span>
          </h3>
          <p className="text-xs text-steam-textMuted mt-1 leading-relaxed max-w-2xl">
            Biblioteki oznaczone są nazwami zwierząt — decyduje wyłącznie zawartość gier! 
            Możesz układać konta na wyższych, niższych lub równorzędnych poziomach priorytetu.
          </p>
        </div>

        {/* Live Auto-save indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-steam-dark border border-steam-border/60 text-xs">
          <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-steam-highlight animate-ping' : 'bg-steam-green'}`} />
          <span className="text-steam-textMuted font-medium">{saveStatusText}</span>
        </div>
      </div>

      {/* Tier Sections */}
      <div className="space-y-5">
        {tierConfigs.map((cfg) => {
          const tierAccounts = accounts.filter((a) => a.tier === cfg.tier);

          return (
            <div
              key={cfg.tier}
              className={`bg-steam-card/90 border-2 ${cfg.borderClass} rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-all`}
            >
              {/* Tier Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-steam-border/40 pb-3">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">{cfg.title}</h4>
                  <p className="text-xs text-steam-textMuted">{cfg.subtitle}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.badgeClass}`}>
                  {tierAccounts.length} {tierAccounts.length === 1 ? 'konto' : 'kont'}
                </span>
              </div>

              {/* Accounts inside this Tier */}
              {tierAccounts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-steam-dark/40 border border-dashed border-steam-border/50 text-center text-xs text-steam-textMuted">
                  Brak kont w tej grupie priorytetu. Użyj przycisków strzałek, aby przenieść tutaj biblioteki.
                </div>
              ) : (
                <div className="space-y-3">
                  {tierAccounts.map((acc) => {
                    const anon = getAnonymousIdentity(acc.steamId);
                    const isExpanded = expandedMatchId === acc.steamId;

                    return (
                      <div
                        key={acc.steamId}
                        className="bg-steam-dark/80 border border-steam-border/70 rounded-2xl p-3.5 sm:p-4 hover:border-steam-borderHover transition-all space-y-3"
                      >
                        {/* Main row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Left: Avatar with Anonymous Badge & Name */}
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border-2 ${anon.borderClass} ${anon.bgClass}`}>
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
                              <div className="flex items-center gap-2 mt-1">
                                {acc.matchedGamesCount > 0 ? (
                                  <button
                                    onClick={() => setExpandedMatchId(isExpanded ? null : acc.steamId)}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-steam-highlight/15 hover:bg-steam-highlight/25 text-steam-highlight text-[11px] font-bold border border-steam-highlight/30 transition-colors"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Pasuje {acc.matchedGamesCount} Twoich gier</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-steam-textMuted">
                                    Brak wybranych przez Ciebie gier
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions (Move Tier & Inspect) */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                            {/* Inspect full anonymous library */}
                            <button
                              onClick={() => {
                                setInspectSteamId(acc.steamId);
                                setInspectName(anon.name);
                              }}
                              className="p-2 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-steam-blue text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Przeglądaj wszystkie gry tego konta"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Gry</span>
                            </button>

                            {/* Move Up */}
                            <button
                              onClick={() => handleMoveTier(acc.steamId, 1)}
                              disabled={acc.tier === 3}
                              className="p-2 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-white hover:text-steam-highlight text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                              title="Zwiększ priorytet (przenieś wyżej)"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>

                            {/* Move Down */}
                            <button
                              onClick={() => handleMoveTier(acc.steamId, -1)}
                              disabled={acc.tier === 0}
                              className="p-2 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-white hover:text-steam-textMuted text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                              title="Zmniejsz priorytet (przenieś niżej)"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Matching Games Drawer (Fixes hover closing bug) */}
                        {isExpanded && acc.matchedGames.length > 0 && (
                          <div className="pt-3 border-t border-steam-border/50 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs text-steam-textMuted">
                              <span>Gry z tej biblioteki, które zaznaczyłeś w Asystencie:</span>
                              <button
                                onClick={() => setExpandedMatchId(null)}
                                className="text-steam-blue hover:underline text-[11px]"
                              >
                                Zwiń listę ▲
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
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
    </div>
  );
}
