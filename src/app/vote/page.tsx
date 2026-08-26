'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Vote, 
  RefreshCw, 
  Star, 
  ThumbsUp, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Gamepad2, 
  Layers,
  Sparkles,
  Check,
  DollarSign,
  Trash2
} from 'lucide-react';
import GameCard, { GameItem } from '@/components/GameCard';
import GameFiltersBar from '@/components/GameFiltersBar';
import AccountRankingBoard, { AccountWithMatches } from '@/components/AccountRankingBoard';
import LowSelectionWarningModal from '@/components/LowSelectionWarningModal';
import ClearSelectionConfirmModal from '@/components/ClearSelectionConfirmModal';
import VoterStatusWidget, { VoterStatusItem } from '@/components/VoterStatusWidget';

export default function VotePage() {
  const [user, setUser] = useState<{ steamId: string; personaName: string; avatarUrl: string } | null>(null);
  const [phase, setPhase] = useState<string>('voting');
  const [stage, setStage] = useState<'games' | 'accounts'>('games');
  const [games, setGames] = useState<GameItem[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [wishlistAppIds, setWishlistAppIds] = useState<number[]>([]);
  const [accountsWithMatches, setAccountsWithMatches] = useState<AccountWithMatches[]>([]);
  const [votersStatus, setVotersStatus] = useState<VoterStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingWishlist, setIsImportingWishlist] = useState(false);
  const [isSavingAccountPrefs, setIsSavingAccountPrefs] = useState(false);
  const [showLowWarning, setShowLowWarning] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingVotes, setIsClearingVotes] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Step 1
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sort, setSort] = useState('popular');
  const [voteFilter, setVoteFilter] = useState<'all' | 'voted' | 'must' | 'interested'>('all');
  const [hideOwned, setHideOwned] = useState<boolean>(true); // Default: Hide games user already owns

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      setUser(meData.user);
      setPhase(meData.phase);

      const [gamesRes, statsRes] = await Promise.all([
        fetch(`/api/games?sort=${sort}`),
        fetch('/api/stats'),
      ]);

      const gamesData = await gamesRes.json();
      setGames(gamesData.games || []);
      setGenres(gamesData.genres || []);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setVotersStatus(statsData.votersStatus || []);
      }

      if (meData.user) {
        const [votesRes, accPrefsRes] = await Promise.all([
          fetch('/api/votes'),
          fetch('/api/account-preferences'),
        ]);

        if (votesRes.ok) {
          const votesData = await votesRes.json();
          setVotes(votesData.votes || {});
          setWishlistAppIds(votesData.wishlistAppIds || []);
        }

        if (accPrefsRes.ok) {
          const accPrefsData = await accPrefsRes.json();
          setAccountsWithMatches(accPrefsData.accounts || []);
        }
      }
    } catch (err) {
      console.error('Error fetching vote data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (appId: number, score: number) => {
    const previousVotes = { ...votes };
    const updatedVotes = { ...votes };
    if (score === 0) {
      delete updatedVotes[appId];
    } else {
      updatedVotes[appId] = score;
    }
    setVotes(updatedVotes);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, score }),
      });

      if (!res.ok) {
        setVotes(previousVotes);
      } else {
        // Refresh account matches and stats in background
        const [accPrefsRes, statsRes] = await Promise.all([
          fetch('/api/account-preferences'),
          fetch('/api/stats'),
        ]);
        if (accPrefsRes.ok) {
          const accPrefsData = await accPrefsRes.json();
          setAccountsWithMatches(accPrefsData.accounts || []);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setVotersStatus(statsData.votersStatus || []);
        }
      }
    } catch (err) {
      console.error('Error saving vote:', err);
      setVotes(previousVotes);
    }
  };

  const handleImportWishlist = async () => {
    setIsImportingWishlist(true);
    try {
      const res = await fetch('/api/wishlist/import', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setToastMessage(result.message);
        setTimeout(() => setToastMessage(null), 4000);
        if (result.wishlistAppIds) {
          setWishlistAppIds(result.wishlistAppIds);
        }
        await fetchData();
      } else {
        alert(result.error || 'Błąd importowania');
      }
    } catch (err) {
      console.error('Error importing wishlist:', err);
    } finally {
      setIsImportingWishlist(false);
    }
  };

  const handleClearAllVotes = async () => {
    setIsClearingVotes(true);
    try {
      const res = await fetch('/api/votes', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setVotes({});
        setWishlistAppIds([]);
        setShowClearConfirm(false);
        setToastMessage(data.message || 'Wyczyszczono wszystkie zaznaczenia.');
        setTimeout(() => setToastMessage(null), 3000);

        const accPrefsRes = await fetch('/api/account-preferences');
        if (accPrefsRes.ok) {
          const accPrefsData = await accPrefsRes.json();
          setAccountsWithMatches(accPrefsData.accounts || []);
        }
      }
    } catch (err) {
      console.error('Error clearing votes:', err);
    } finally {
      setIsClearingVotes(false);
    }
  };

  const handleSaveAccountPreferences = useCallback(
    async (prefs: Array<{ targetSteamId: string; tier: number; rankOrder: number }>) => {
      setIsSavingAccountPrefs(true);
      try {
        await fetch('/api/account-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: prefs }),
        });

        // Update voter status
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setVotersStatus(statsData.votersStatus || []);
        }
      } catch (err) {
        console.error('Error saving account preferences:', err);
      } finally {
        setIsSavingAccountPrefs(false);
      }
    },
    []
  );

  const selectedGamesList = games.filter((g) => (votes[g.appId] || 0) > 0);
  const selectedCount = selectedGamesList.length;
  const totalValueCents = selectedGamesList.reduce((acc, g) => acc + (g.priceFinal || 0), 0);
  const totalValueFormatted = totalValueCents > 0 ? `${(totalValueCents / 100).toFixed(2).replace('.', ',')} zł` : '0,00 zł';

  const handleProceedToAccounts = () => {
    if (selectedCount < 5) {
      setShowLowWarning(true);
    } else {
      setStage('accounts');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-steam-blue">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Ładowanie katalogu do głosowania...</p>
        </div>
      </div>
    );
  }

  // Not logged in view
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-steam-card border border-steam-border p-8 rounded-3xl shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-steam-blue/20 text-steam-blue flex items-center justify-center mx-auto shadow-glow-blue">
          <Vote className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">Głosowanie na Biblioteki</h2>
          <p className="text-xs text-steam-textMuted">Zaloguj się przez Steam, aby wziąć udział w głosowaniu.</p>
        </div>
        <a
          href="/api/auth/steam"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-black text-sm transition-all shadow-md active:scale-95"
        >
          <span>Zaloguj przez Steam</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // Phase lock
  if (phase !== 'voting') {
    return (
      <div className="max-w-md mx-auto my-12 bg-steam-card border border-steam-border p-8 rounded-3xl shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-steam-border/40 text-steam-textMuted flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Głosowanie jest obecnie zablokowane</h2>
        <p className="text-xs text-steam-textMuted">
          {phase === 'registration'
            ? 'Projekt znajduje się w fazie 1 (Zgłaszanie kont). Głosowanie zostanie odblokowane przez administratora.'
            : 'Głosowanie zostało zakończone. Sprawdź oficjalne wyniki na stronie głównej.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-steam-navy hover:bg-steam-dark border border-steam-border rounded-xl text-xs font-bold text-white transition-colors"
        >
          <span>Wróć na stronę główną</span>
        </Link>
      </div>
    );
  }

  // Filter games for Step 1
  let filteredGames = [...games];

  // Hide games user already owns if toggle is active
  if (hideOwned) {
    filteredGames = filteredGames.filter((g) => !g.isOwnedByMe);
  }

  if (search) {
    filteredGames = filteredGames.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  }
  if (selectedGenre && selectedGenre !== 'all') {
    filteredGames = filteredGames.filter((g) => g.genres.includes(selectedGenre));
  }
  if (voteFilter === 'voted') {
    filteredGames = filteredGames.filter((g) => (votes[g.appId] || 0) > 0);
  } else if (voteFilter === 'must') {
    filteredGames = filteredGames.filter((g) => votes[g.appId] === 3);
  } else if (voteFilter === 'interested') {
    filteredGames = filteredGames.filter((g) => votes[g.appId] === 1);
  }

  // Wishlist games are ALWAYS on the very top, sorted by the selected sort
  const wishlistSet = new Set(wishlistAppIds);
  const wishlistGames = filteredGames.filter((g) => wishlistSet.has(g.appId));
  const otherGames = filteredGames.filter((g) => !wishlistSet.has(g.appId));
  const displayGames = [...wishlistGames, ...otherGames];

  return (
    <div className="space-y-6 pb-20">
      <LowSelectionWarningModal
        isOpen={showLowWarning}
        selectedCount={selectedCount}
        onCancel={() => setShowLowWarning(false)}
        onProceed={() => {
          setShowLowWarning(false);
          setStage('accounts');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <ClearSelectionConfirmModal
        isOpen={showClearConfirm}
        selectedCount={selectedCount}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllVotes}
        isClearing={isClearingVotes}
      />

      {/* Voter Turnout Widget */}
      <VoterStatusWidget votersStatus={votersStatus} title="Status głosowania w społeczności" />

      {/* Top Stepper / Stage Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-steam-card border border-steam-border p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStage('games')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              stage === 'games'
                ? 'bg-steam-blue text-steam-dark shadow-md'
                : 'bg-steam-dark text-steam-textMuted hover:text-white border border-steam-border/40'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>1. Asystent gier ({selectedCount})</span>
          </button>

          <button
            onClick={() => setStage('accounts')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              stage === 'accounts'
                ? 'bg-steam-highlight text-steam-dark shadow-md'
                : 'bg-steam-dark text-steam-textMuted hover:text-white border border-steam-border/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Ranking bibliotek</span>
          </button>
        </div>

        {stage === 'games' ? (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-steam-textMuted block uppercase tracking-wider">Wartość Twoich wyborów</span>
              <span className="text-xs font-black text-steam-green">{totalValueFormatted}</span>
            </div>
            <button
              onClick={handleProceedToAccounts}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-xs rounded-2xl shadow-md transition-all active:scale-95"
            >
              <span>Przejdź do układania kont</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setStage('games')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-steam-navy hover:bg-steam-dark border border-steam-border text-white text-xs font-bold rounded-2xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Wróć do wyboru gier</span>
          </button>
        )}
      </div>

      {/* Toast message if present */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-steam-greenDark/20 border border-steam-greenDark/40 text-steam-green text-xs font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Stage 1: Game Assistant */}
      {stage === 'games' && (
        <div className="space-y-6">
          {/* Intro Card with Savings Value Badge */}
          <div className="p-5 bg-steam-card/80 border border-steam-border/70 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-steam-blue" />
                <span>Krok 1: Wskaż gry, które Cię interesują (Opcjonalne)</span>
              </h3>
              <p className="text-xs text-steam-textMuted mt-1 leading-relaxed max-w-2xl">
                Wybierz pozycje, w które chcesz zagrać lub zaimportuj swoją wishlistę. Gry, które już masz na Steam, są domyślnie ukryte.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
              <div className="px-3.5 py-2 rounded-2xl bg-steam-green/10 border border-steam-green/30 text-center">
                <span className="text-[10px] text-steam-textMuted block font-semibold">Wartość wybranych:</span>
                <span className="text-xs font-black text-steam-green">{totalValueFormatted}</span>
              </div>

              <button
                onClick={() => setStage('accounts')}
                className="text-xs text-steam-textMuted hover:text-white underline whitespace-nowrap"
              >
                Pomiń i przejdź do kont ⏩
              </button>
            </div>
          </div>

          {/* Filters Bar with 9 Sort Modes, Hide Owned Toggle & Clear Selection */}
          <GameFiltersBar
            search={search}
            onSearchChange={setSearch}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            genres={genres}
            sort={sort}
            onSortChange={setSort}
            voteFilter={voteFilter}
            onVoteFilterChange={setVoteFilter}
            hideOwned={hideOwned}
            onHideOwnedChange={setHideOwned}
            onImportWishlist={handleImportWishlist}
            isImportingWishlist={isImportingWishlist}
            onClearAllVotes={() => setShowClearConfirm(true)}
            selectedVotesCount={selectedCount}
            totalGames={games.length}
            filteredCount={displayGames.length}
          />

          {/* Games Grid */}
          {displayGames.length === 0 ? (
            <div className="text-center py-16 bg-steam-card border border-steam-border rounded-3xl space-y-2">
              <p className="text-xs text-steam-textMuted">Brak gier spełniających kryteria.</p>
              {hideOwned && (
                <button
                  onClick={() => setHideOwned(false)}
                  className="text-xs text-steam-blue hover:underline"
                >
                  Pokaż także gry, które już posiadam
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {displayGames.map((game) => (
                <GameCard
                  key={game.appId}
                  game={game}
                  currentVote={votes[game.appId] || 0}
                  onVote={handleVote}
                  isWishlist={wishlistSet.has(game.appId)}
                />
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="p-5 bg-steam-card border border-steam-border rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-steam-text flex items-center gap-2">
              <span>
                Wybrano <strong>{selectedCount}</strong> {selectedCount === 1 ? 'grę' : 'gier'} z katalogu.
              </span>
              <span className="text-steam-green font-bold">({totalValueFormatted})</span>
            </div>
            <button
              onClick={handleProceedToAccounts}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-xs rounded-2xl shadow-md transition-all active:scale-95"
            >
              <span>Zatwierdź i ułóż ranking bibliotek</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sticky Bottom Floating Bar */}
          <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 bg-steam-navy/95 backdrop-blur-md border border-steam-border rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-steam-highlight/20 text-steam-highlight flex items-center justify-center flex-shrink-0 font-black text-xs">
                {selectedCount}
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-bold text-white truncate">
                  {selectedCount === 0 ? 'Wybierz gry z katalogu' : `Wybrano: ${selectedCount} gier`}
                </span>
                <span className="block text-[10px] text-steam-green font-bold">
                  Wartość: {totalValueFormatted}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToAccounts}
              className="flex items-center gap-1.5 px-4 py-2 bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-xs rounded-xl shadow-md transition-all whitespace-nowrap active:scale-95 flex-shrink-0"
            >
              <span>Dalej do kont</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Account Relational Ranking Board */}
      {stage === 'accounts' && (
        <div className="space-y-6">
          <AccountRankingBoard
            initialAccounts={accountsWithMatches}
            onSavePreferences={handleSaveAccountPreferences}
            isSaving={isSavingAccountPrefs}
          />
        </div>
      )}
    </div>
  );
}
