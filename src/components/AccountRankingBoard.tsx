'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ArrowUp, 
  ArrowDown, 
  Equal, 
  Sparkles, 
  Gamepad2, 
  ExternalLink, 
  Check, 
  Info,
  Layers,
  Search,
  Eye
} from 'lucide-react';
import AccountLibraryModal from './AccountLibraryModal';

export interface AccountWithMatches {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
  totalGames: number;
  shareableGames: number;
  tier: number; // 3 (Priority 1), 2 (Priority 2), 1 (Priority 3), 0 (Neutral)
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
  const [hoveredMatchSteamId, setHoveredMatchSteamId] = useState<string | null>(null);
  const [inspectSteamId, setInspectSteamId] = useState<string | null>(null);
  const [inspectName, setInspectName] = useState<string>('');

  useEffect(() => {
    // If no tiers set yet, initialize suggested order based on matchedGamesCount descending
    const sorted = [...initialAccounts].sort((a, b) => {
      if (b.tier !== a.tier) return b.tier - a.tier;
      if (b.matchedGamesCount !== a.matchedGamesCount) return b.matchedGamesCount - a.matchedGamesCount;
      return b.shareableGames - a.shareableGames;
    });

    // If all are tier 0, auto-assign suggested tiers based on matched count
    const hasAnyTier = sorted.some((a) => a.tier > 0);
    if (!hasAnyTier && sorted.length > 0) {
      const withSuggested = sorted.map((acc, index) => {
        let suggestedTier = 0;
        if (acc.matchedGamesCount >= 5 || index === 0) suggestedTier = 3;
        else if (acc.matchedGamesCount >= 2 || index < 3) suggestedTier = 2;
        else if (acc.matchedGamesCount >= 1 || index < 5) suggestedTier = 1;
        return { ...acc, tier: suggestedTier, rankOrder: index };
      });
      setAccounts(withSuggested);
      // Auto-save initial suggestion
      onSavePreferences(
        withSuggested.map((a, i) => ({
          targetSteamId: a.steamId,
          tier: a.tier,
          rankOrder: i,
        }))
      );
    } else {
      setAccounts(sorted);
    }
  }, [initialAccounts, onSavePreferences]);

  const updateAndSave = (updated: AccountWithMatches[]) => {
    setAccounts(updated);
    onSavePreferences(
      updated.map((a, i) => ({
        targetSteamId: a.steamId,
        tier: a.tier,
        rankOrder: i,
      }))
    );
  };

  const handleMoveTier = (steamId: string, delta: number) => {
    const updated = accounts.map((acc) => {
      if (acc.steamId === steamId) {
        const newTier = Math.max(0, Math.min(3, acc.tier + delta));
        return { ...acc, tier: newTier };
      }
      return acc;
    });
    updateAndSave(updated);
  };

  const handleSetTier = (steamId: string, tier: number) => {
    const updated = accounts.map((acc) => (acc.steamId === steamId ? { ...acc, tier } : acc));
    updateAndSave(updated);
  };

  const handleEqualize = (sourceSteamId: string, targetTier: number) => {
    const updated = accounts.map((acc) => (acc.steamId === sourceSteamId ? { ...acc, tier: targetTier } : acc));
    updateAndSave(updated);
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
    <div className="space-y-6">
      <AccountLibraryModal
        steamId={inspectSteamId}
        accountName={inspectName}
        onClose={() => setInspectSteamId(null)}
      />

      {/* Intro info bar */}
      <div className="p-4 sm:p-5 bg-steam-card border border-steam-border rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-steam-blue/20 text-steam-blue flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">
              Hierarchia Kont i Bibliotek Znajomych
            </h3>
            <p className="text-xs text-steam-textMuted leading-relaxed mt-0.5">
              Uszereguj konta według swoich preferencji. Konta na tym samym poziomie traktowane są <strong>na równi</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isSaving ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-steam-blue/20 text-steam-blue border border-steam-blue/40 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-steam-blue" />
              Zapisywanie...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-steam-green/20 text-steam-green border border-steam-green/40 font-bold">
              <Check className="w-3.5 h-3.5" />
              Zapisano na bieżąco
            </span>
          )}
        </div>
      </div>

      {/* Tiers Container */}
      <div className="space-y-5">
        {tierConfigs.map((cfg) => {
          const tierAccounts = accounts.filter((a) => a.tier === cfg.tier);

          return (
            <div
              key={cfg.tier}
              className={`bg-steam-card/80 border rounded-3xl p-5 shadow-lg space-y-3 transition-all ${cfg.borderClass}`}
            >
              {/* Tier Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-steam-border/40 pb-3">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>{cfg.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-steam-dark text-white border border-steam-border">
                      {tierAccounts.length}
                    </span>
                  </h4>
                  <p className="text-[11px] text-steam-textMuted mt-0.5">{cfg.subtitle}</p>
                </div>
              </div>

              {/* Accounts inside this tier */}
              {tierAccounts.length === 0 ? (
                <div className="text-center py-6 text-xs text-steam-textMuted/70 border border-dashed border-steam-border/30 rounded-2xl">
                  Przeciągnij lub przenieś tutaj konta przyciskami ⬆️ / ⬇️
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tierAccounts.map((acc) => (
                    <div
                      key={acc.steamId}
                      className="relative p-4 rounded-2xl bg-steam-dark/90 border border-steam-border/60 hover:border-steam-blue/50 flex flex-col justify-between gap-3 shadow-sm transition-all"
                    >
                      {/* Top Account Info */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-steam-border flex-shrink-0">
                            <Image
                              src={acc.avatarUrl || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                              alt={acc.personaName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-white text-sm truncate">{acc.personaName}</h5>
                              <a
                                href={acc.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-steam-textMuted hover:text-white p-0.5"
                                title="Profil Steam"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-[11px] text-steam-textMuted">
                              {acc.shareableGames} gier Family Share
                            </p>
                          </div>
                        </div>

                        {/* Inspect full library button */}
                        <button
                          onClick={() => {
                            setInspectSteamId(acc.steamId);
                            setInspectName(acc.personaName);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-[11px] text-steam-blue font-bold transition-all flex-shrink-0"
                          title="Przeglądaj wszystkie gry tego konta"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Gry</span>
                        </button>
                      </div>

                      {/* Matching Games preview pill & Hover Popover */}
                      <div className="relative">
                        <div
                          onMouseEnter={() => setHoveredMatchSteamId(acc.steamId)}
                          onMouseLeave={() => setHoveredMatchSteamId(null)}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                            acc.matchedGamesCount > 0
                              ? 'bg-steam-green/10 border border-steam-green/30 text-steam-green hover:bg-steam-green/20'
                              : 'bg-steam-navy/40 border border-steam-border/30 text-steam-textMuted'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            <span>
                              {acc.matchedGamesCount > 0
                                ? `Zawiera ${acc.matchedGamesCount} z Twoich wybranych gier`
                                : 'Brak bezpośrednio wybranych gier'}
                            </span>
                          </div>
                          {acc.matchedGamesCount > 0 && (
                            <span className="text-[10px] underline font-bold">Podgląd</span>
                          )}
                        </div>

                        {/* Hover Tooltip/Popover with actual matched games */}
                        {hoveredMatchSteamId === acc.steamId && acc.matchedGames.length > 0 && (
                          <div className="absolute z-30 bottom-full left-0 right-0 mb-2 p-3 bg-steam-card border border-steam-border rounded-2xl shadow-2xl space-y-2 animate-fadeIn font-sans max-h-48 overflow-y-auto">
                            <div className="flex items-center justify-between text-[11px] font-bold text-white border-b border-steam-border/40 pb-1.5">
                              <span>Wybrane gry na koncie {acc.personaName}:</span>
                              <span className="text-steam-green font-mono">{acc.matchedGames.length}</span>
                            </div>
                            <div className="space-y-1.5">
                              {acc.matchedGames.map((g) => (
                                <div key={g.appId} className="flex items-center justify-between gap-2 text-xs p-1 rounded bg-steam-dark/60">
                                  <span className="text-white truncate font-medium">{g.name}</span>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {g.priceFormatted && (
                                      <span className="text-[10px] text-steam-textMuted font-mono">{g.priceFormatted}</span>
                                    )}
                                    {g.voterScore === 3 ? (
                                      <span className="px-1.5 py-0.2 rounded bg-steam-highlight/20 text-steam-highlight text-[9px] font-bold">
                                        Must-Have
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded bg-steam-blue/20 text-steam-blue text-[9px] font-bold">
                                        Chętnie
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tier Actions (Up, Down, Move) */}
                      <div className="pt-2 border-t border-steam-border/40 flex items-center justify-between gap-1.5 text-xs">
                        <span className="text-[11px] text-steam-textMuted font-semibold">Zmień priorytet:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveTier(acc.steamId, 1)}
                            disabled={acc.tier === 3}
                            className="p-1.5 rounded-lg bg-steam-navy hover:bg-steam-blue hover:text-steam-dark border border-steam-border text-white text-xs font-bold transition-all disabled:opacity-30"
                            title="Przenieś wyżej"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveTier(acc.steamId, -1)}
                            disabled={acc.tier === 0}
                            className="p-1.5 rounded-lg bg-steam-navy hover:bg-steam-blue hover:text-steam-dark border border-steam-border text-white text-xs font-bold transition-all disabled:opacity-30"
                            title="Przenieś niżej"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
