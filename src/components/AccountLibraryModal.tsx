'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  X, 
  Search, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  ArrowUpDown
} from 'lucide-react';
import { getAnonymousIdentity, isAnimalName } from '@/lib/anonymous';

interface GameDetail {
  appId: number;
  name: string;
  headerImage: string;
  isFamilyShareable: boolean;
  isExcluded: boolean;
  isPending: boolean;
  genres: string[];
  priceFinal?: number;
  priceFormatted?: string;
  reviewsGlobalPercent: number;
  reviewsGlobalCount: number;
  reviewsGlobalDesc: string;
  reviewsPolishPercent: number;
  reviewsPolishCount: number;
  reviewsPolishDesc: string;
  playtimeForever: number;
}

interface AccountLibraryModalProps {
  steamId: string | null;
  accountName: string;
  onClose: () => void;
}

export default function AccountLibraryModal({ steamId, accountName, onClose }: AccountLibraryModalProps) {
  const [games, setGames] = useState<GameDetail[]>([]);
  const [account, setAccount] = useState<{
    persona_name: string;
    avatar_url: string;
    profile_url: string;
    total_games: number;
    shareable_games: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'shareable' | 'excluded' | 'all'>('shareable');
  const [sortBy, setSortBy] = useState<'playtime' | 'price_desc' | 'price_asc' | 'reviews_global' | 'reviews_polish' | 'name_asc' | 'name_desc'>('playtime');

  const anonIdentity = steamId ? getAnonymousIdentity(steamId) : null;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset search and tab on new account
  useEffect(() => {
    if (steamId) {
      setSearch('');
      setTab('shareable');
      setSortBy('playtime');
    }
  }, [steamId]);

  // Isolate and reset scroll position whenever tab, search, sort or account changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [tab, search, sortBy, steamId]);

  useEffect(() => {
    if (!steamId) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/admin/account-games?steamId=${steamId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.games) {
          setGames(data.games);
          setAccount(data.account);
        }
      })
      .catch((err) => console.error('Error fetching account games:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [steamId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!steamId) return null;

  // Filter games based on active tab and search
  const filteredGames = games.filter((g) => {
    if (tab === 'shareable' && !g.isFamilyShareable) return false;
    if (tab === 'excluded' && !g.isExcluded) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort games
  filteredGames.sort((a, b) => {
    switch (sortBy) {
      case 'playtime':
        return b.playtimeForever - a.playtimeForever || (b.priceFinal || 0) - (a.priceFinal || 0);
      case 'price_desc':
        return (b.priceFinal || 0) - (a.priceFinal || 0) || b.playtimeForever - a.playtimeForever;
      case 'price_asc':
        return (a.priceFinal || 0) - (b.priceFinal || 0) || b.playtimeForever - a.playtimeForever;
      case 'reviews_global':
        return b.reviewsGlobalPercent - a.reviewsGlobalPercent || b.reviewsGlobalCount - a.reviewsGlobalCount;
      case 'reviews_polish':
        return b.reviewsPolishPercent - a.reviewsPolishPercent || b.reviewsPolishCount - a.reviewsPolishCount;
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const shareableCount = games.filter((g) => g.isFamilyShareable).length;
  const excludedCount = games.filter((g) => g.isExcluded).length;
  const shareableValueCents = games.filter((g) => g.isFamilyShareable).reduce((acc, g) => acc + (g.priceFinal || 0), 0);
  const shareableValueFormatted = shareableValueCents > 0
    ? `${(shareableValueCents / 100).toFixed(2).replace('.', ',')} zł`
    : '0,00 zł';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-steam-card border border-steam-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-steam-border bg-steam-navy/90 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isAnimalName(accountName) ? (
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border-2 ${anonIdentity?.borderClass || 'border-steam-blue'} ${anonIdentity?.bgClass || 'bg-steam-blue/20'}`}>
                <span>{anonIdentity?.emoji || '🎮'}</span>
              </div>
            ) : account && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-steam-blue flex-shrink-0">
                <Image
                  src={account.avatar_url || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                  alt={account.persona_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Biblioteka: {accountName || account?.persona_name}
                </h3>
                {!isAnimalName(accountName) && account?.profile_url && (
                  <a
                    href={account.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-steam-textMuted hover:text-white"
                    title="Otwórz profil Steam"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-steam-textMuted font-mono">
                {isAnimalName(accountName) ? 'Biblioteka w głosowaniu' : steamId} &bull; {shareableCount} gier Family Share ({shareableValueFormatted}) z {games.length} ogółem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-steam-textMuted hover:text-white hover:bg-steam-border/50 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Tabs + Sort */}
        <div className="p-4 border-b border-steam-border/60 bg-steam-dark/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-steam-dark p-1 rounded-xl border border-steam-border flex-shrink-0">
            <button
              onClick={() => setTab('shareable')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'shareable'
                  ? 'bg-steam-green text-steam-dark shadow-sm'
                  : 'text-steam-textMuted hover:text-white'
              }`}
            >
              Współdzielone ({shareableCount})
            </button>
            <button
              onClick={() => setTab('excluded')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'excluded'
                  ? 'bg-steam-danger text-white shadow-sm'
                  : 'text-steam-textMuted hover:text-white'
              }`}
            >
              Wykluczone ({excludedCount})
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'all'
                  ? 'bg-steam-blue text-steam-dark shadow-sm'
                  : 'text-steam-textMuted hover:text-white'
              }`}
            >
              Wszystkie ({games.length})
            </button>
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-steam-textMuted flex-shrink-0 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-steam-dark border border-steam-border rounded-xl text-xs text-white focus:outline-none focus:border-steam-blue"
              >
                <option value="playtime">⏱️ Czas gry właściciela (najwięcej)</option>
                <option value="price_desc">💰 Cena: od najwyższej</option>
                <option value="price_asc">🏷️ Cena: od najniższej</option>
                <option value="reviews_global">🌍 Oceny: Świat (% pozytyw.)</option>
                <option value="reviews_polish">🇵🇱 Oceny: Polska (% pozytyw.)</option>
                <option value="name_asc">🔤 Nazwa: A - Z</option>
                <option value="name_desc">🔤 Nazwa: Z - A</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-steam-textMuted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtruj w tej bibliotece..."
                className="w-full pl-8 pr-3 py-1.5 bg-steam-dark border border-steam-border rounded-xl text-xs text-white placeholder-steam-textMuted focus:outline-none focus:border-steam-blue"
              >
              </input>
            </div>
          </div>
        </div>

        {/* Content list with isolated scroll container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-steam-blue gap-3">
              <RefreshCw className="w-7 h-7 animate-spin" />
              <p className="text-xs">Ładowanie biblioteki...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-16 text-xs text-steam-textMuted">
              Brak gier spełniających kryteria wyszukiwania.
            </div>
          ) : (
            filteredGames.map((game) => {
              const playtimeHours = Math.floor(game.playtimeForever / 60);
              const playtimeMinutes = game.playtimeForever % 60;
              const playtimeFormatted = playtimeHours > 0 
                ? `${playtimeHours} godz.${playtimeMinutes > 0 ? ` ${playtimeMinutes} min.` : ''}`
                : game.playtimeForever > 0 
                ? `${game.playtimeForever} min.`
                : 'Brak';

              return (
                <div
                  key={game.appId}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-steam-dark/80 border border-steam-border/60 hover:border-steam-borderHover transition-colors"
                >
                  {/* Left: Thumbnail & Title */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative w-24 h-12 rounded-lg overflow-hidden bg-steam-dark flex-shrink-0 border border-steam-border/40">
                      <Image
                        src={game.headerImage}
                        alt={game.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm truncate" title={game.name}>
                          {game.name}
                        </h4>
                        <a
                          href={`https://store.steampowered.com/app/${game.appId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-steam-textMuted hover:text-white flex-shrink-0 p-0.5"
                          title="Otwórz na Steam"
                          aria-label={`Otwórz ${game.name} w sklepie Steam`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {game.priceFormatted && (
                          <span className="px-1.5 py-0.2 rounded bg-steam-navy text-[10px] text-white font-semibold">
                            {game.priceFormatted}
                          </span>
                        )}
                        {game.reviewsGlobalPercent > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              game.reviewsGlobalPercent >= 70
                                ? 'bg-blue-500/20 text-steam-blue'
                                : 'bg-yellow-500/20 text-steam-highlight'
                            }`}
                            title={`Świat: ${game.reviewsGlobalPercent}% pozytywnych (${game.reviewsGlobalCount.toLocaleString()} ocen)`}
                          >
                            🌍 {game.reviewsGlobalPercent}%
                          </span>
                        )}
                        {game.reviewsPolishPercent > 0 && (
                          <span
                            className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[10px] font-bold"
                            title={`Polska: ${game.reviewsPolishPercent}% pozytywnych (${game.reviewsPolishCount.toLocaleString()} ocen)`}
                          >
                            🇵🇱 {game.reviewsPolishPercent}%
                          </span>
                        )}
                        <span className={`text-[10px] flex items-center gap-1 ml-1 px-1.5 py-0.2 rounded ${
                          game.playtimeForever > 600
                            ? 'bg-steam-highlight/20 text-steam-highlight font-bold'
                            : 'text-steam-textMuted bg-steam-card'
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          <span>{playtimeFormatted}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Shareable status */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {game.isFamilyShareable ? (
                      <span className="px-2.5 py-1 rounded-full bg-steam-green/20 text-steam-green text-[10px] font-bold border border-steam-green/40">
                        Family Share
                      </span>
                    ) : game.isExcluded ? (
                      <span className="px-2.5 py-1 rounded-full bg-steam-danger/20 text-steam-danger text-[10px] font-bold border border-steam-danger/40">
                        Wykluczona (Brak Share)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-steam-blue/20 text-steam-blue text-[10px] font-bold border border-steam-blue/40">
                        Oczekuje...
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-steam-border bg-steam-navy/40 flex items-center justify-between text-xs text-steam-textMuted flex-shrink-0">
          <span>Wyświetlono {filteredGames.length} pozycji (posortowano: {
            sortBy === 'playtime' ? 'Czas gry' :
            sortBy === 'price_desc' ? 'Cena malejąco' :
            sortBy === 'price_asc' ? 'Cena rosnąco' :
            sortBy === 'reviews_global' ? 'Oceny Świat' :
            sortBy === 'reviews_polish' ? 'Oceny Polska' : 'Nazwa'
          })</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
