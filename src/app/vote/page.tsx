'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Vote, 
  RefreshCw, 
  Star, 
  ThumbsUp, 
  Check, 
  Lock, 
  ArrowRight, 
  Gamepad2, 
  Sparkles,
  Info
} from 'lucide-react';
import GameCard, { GameItem } from '@/components/GameCard';
import GameFiltersBar from '@/components/GameFiltersBar';

export default function VotePage() {
  const [user, setUser] = useState<{ steamId: string; personaName: string; avatarUrl: string } | null>(null);
  const [phase, setPhase] = useState<string>('voting');
  const [games, setGames] = useState<GameItem[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingWishlist, setIsImportingWishlist] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sort, setSort] = useState('owners');
  const [voteFilter, setVoteFilter] = useState<'all' | 'voted' | 'must' | 'interested'>('all');

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      setUser(meData.user);
      setPhase(meData.phase);

      // Fetch games catalog
      const gamesRes = await fetch(`/api/games?sort=${sort}`);
      const gamesData = await gamesRes.json();
      setGames(gamesData.games || []);
      setGenres(gamesData.genres || []);

      // Fetch user's existing votes if logged in
      if (meData.user) {
        const votesRes = await fetch('/api/votes');
        const votesData = await votesRes.json();
        setVotes(votesData.votes || {});
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

  // Handle vote toggle
  const handleVote = async (appId: number, score: number) => {
    // Optimistic UI update
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
      }
    } catch (err) {
      console.error('Error saving vote:', err);
      setVotes(previousVotes);
    }
  };

  // Handle Steam Wishlist Import
  const handleImportWishlist = async () => {
    setIsImportingWishlist(true);
    try {
      const res = await fetch('/api/wishlist/import', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setToastMessage(result.message);
        // Refresh votes
        const votesRes = await fetch('/api/votes');
        const votesData = await votesRes.json();
        setVotes(votesData.votes || {});
      } else {
        alert(result.error || 'Błąd importowania');
      }
    } catch (err) {
      console.error('Error importing wishlist:', err);
    } finally {
      setIsImportingWishlist(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-steam-blue">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Ładowanie katalogu gier...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-steam-card border border-steam-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-steam-highlight/20 text-steam-highlight flex items-center justify-center mx-auto shadow-glow-accent">
          <Vote className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Głosowanie na gry</h2>
          <p className="text-sm text-steam-textMuted leading-relaxed">
            Zaloguj się przez Steam, aby móc oznaczać gry, w które chcesz zagrać i zaimportować swoją wishlistę.
          </p>
        </div>
        <Link
          href="/api/auth/steam"
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-steam-blue to-steam-blueDark text-steam-dark hover:brightness-110 font-bold text-sm shadow-glow-blue transition-all"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.401-1.635 0-3.003-1.15-3.324-2.678L.484 15.01C1.942 20.244 6.746 24 12.44 24c6.627 0 12-5.373 12-12S19.066 0 12.44 0h-.461z" />
          </svg>
          <span>Zaloguj przez Steam</span>
        </Link>
      </div>
    );
  }

  // If not voting phase
  if (phase === 'registration') {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-steam-card border border-steam-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-steam-navy text-steam-highlight flex items-center justify-center mx-auto border border-steam-border">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Głosowanie nie zostało jeszcze otwarte</h2>
          <p className="text-sm text-steam-textMuted leading-relaxed">
            Obecnie trwa <strong className="text-white">Faza 1 (Zgłaszanie Kont)</strong>. Gdy Administrator zamknie zgłoszenia, ten widok zostanie odblokowany dla wszystkich!
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-steam-blue text-steam-dark font-bold text-sm shadow-glow-blue transition-all"
        >
          <span>Przejdź do zgłaszania konta</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Filter games based on current filter states
  const filteredGames = games.filter((g) => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedGenre !== 'all' && !g.genres.includes(selectedGenre)) {
      return false;
    }
    const currentVote = votes[g.appId] || 0;
    if (voteFilter === 'voted' && currentVote === 0) return false;
    if (voteFilter === 'must' && currentVote !== 3) return false;
    if (voteFilter === 'interested' && currentVote !== 1) return false;
    return true;
  });

  const totalVotesCount = Object.keys(votes).length;
  const mustCount = Object.values(votes).filter((v) => v === 3).length;
  const interestedCount = Object.values(votes).filter((v) => v === 1).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-steam-card border-2 border-steam-highlight rounded-2xl shadow-2xl flex items-center gap-3 text-sm text-white animate-bounce">
          <Sparkles className="w-5 h-5 text-steam-highlight flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-steam-card border border-steam-border p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-steam-highlight font-bold text-xs uppercase tracking-wider">
            <Vote className="w-4 h-4" />
            <span>Faza 2: Wybór Preferencji</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Katalog Gier Współdzielonych
          </h2>
          <p className="text-xs text-steam-textMuted max-w-xl">
            Wskaż gry, w które chcesz zagrać. Wybierz ⭐ <strong>Must-Have (3 pkt)</strong> dla najważniejszych hitów oraz 👍 <strong>Chętnie (1 pkt)</strong> dla reszty.
          </p>
        </div>

        {/* Floating User Vote Stats */}
        <div className="flex items-center gap-3 bg-steam-dark/90 p-3.5 rounded-2xl border border-steam-border flex-shrink-0">
          <div className="text-center px-3 border-r border-steam-border/60">
            <div className="text-lg font-black text-white">{totalVotesCount}</div>
            <div className="text-[10px] text-steam-textMuted font-semibold uppercase">Wybranych</div>
          </div>
          <div className="text-center px-2">
            <div className="text-lg font-black text-steam-highlight flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-current" /> {mustCount}
            </div>
            <div className="text-[10px] text-steam-textMuted font-semibold uppercase">Must-Have</div>
          </div>
          <div className="text-center px-2">
            <div className="text-lg font-black text-steam-blue flex items-center justify-center gap-1">
              <ThumbsUp className="w-4 h-4 fill-current" /> {interestedCount}
            </div>
            <div className="text-[10px] text-steam-textMuted font-semibold uppercase">Chętnie</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
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
        onImportWishlist={handleImportWishlist}
        isImportingWishlist={isImportingWishlist}
        totalGames={games.length}
        filteredCount={filteredGames.length}
      />

      {/* Games Catalog Grid */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-16 bg-steam-card/40 border border-steam-border/40 rounded-3xl space-y-3">
          <Gamepad2 className="w-12 h-12 text-steam-textMuted mx-auto opacity-50" />
          <h4 className="text-lg font-bold text-white">Brak gier spełniających kryteria</h4>
          <p className="text-xs text-steam-textMuted">Spróbuj wyczyścić wyszukiwanie lub zmienić wybrany gatunek.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredGames.map((game) => (
            <GameCard
              key={game.appId}
              game={game}
              currentVote={votes[game.appId] || 0}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
