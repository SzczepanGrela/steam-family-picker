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
  Gamepad2, 
  Check
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

  // Filters
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

      const gamesRes = await fetch(`/api/games?sort=${sort}`);
      const gamesData = await gamesRes.json();
      setGames(gamesData.games || []);
      setGenres(gamesData.genres || []);

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
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-steam-blue" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-steam-card border border-steam-border p-6 rounded-2xl shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-xl bg-steam-highlight/20 text-steam-highlight flex items-center justify-center mx-auto">
          <Vote className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Głosowanie na gry</h2>
          <p className="text-xs text-steam-textMuted mt-1">
            Zaloguj się przez Steam, aby wskazać pożądane gry.
          </p>
        </div>
        <Link
          href="/api/auth/steam"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs transition-colors"
        >
          <span>Zaloguj przez Steam</span>
        </Link>
      </div>
    );
  }

  // If not voting phase
  if (phase === 'registration') {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-steam-card border border-steam-border p-6 rounded-2xl shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-xl bg-steam-navy text-steam-highlight flex items-center justify-center mx-auto border border-steam-border">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Głosowanie nieaktywne</h2>
          <p className="text-xs text-steam-textMuted mt-1">
            Trwa Faza 1 (Zgłaszanie Kont). Głosowanie ruszy po zebraniu bibliotek.
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-steam-blue text-steam-dark font-bold text-xs transition-colors"
        >
          <span>Przejdź do zgłaszania</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Filtered games
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
    <div className="space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3 bg-steam-card border border-steam-highlight rounded-xl shadow-2xl flex items-center gap-2 text-xs text-white">
          <Check className="w-4 h-4 text-steam-highlight flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-steam-card border border-steam-border p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white">Katalog Gier Family Share</h2>
          <p className="text-xs text-steam-textMuted">
            Zaznacz ⭐ Must-Have (3 pkt) lub 👍 Chętnie (1 pkt).
          </p>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-3 bg-steam-dark px-3 py-2 rounded-xl border border-steam-border/60 text-xs">
          <span className="text-steam-textMuted">Wybrano: <strong className="text-white">{totalVotesCount}</strong></span>
          <span className="text-steam-highlight flex items-center gap-0.5"><Star className="w-3 h-3 fill-current" /> {mustCount}</span>
          <span className="text-steam-blue flex items-center gap-0.5"><ThumbsUp className="w-3 h-3 fill-current" /> {interestedCount}</span>
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

      {/* Grid */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12 bg-steam-card/40 border border-steam-border/40 rounded-2xl space-y-2">
          <Gamepad2 className="w-8 h-8 text-steam-textMuted mx-auto opacity-40" />
          <p className="text-xs text-steam-textMuted">Brak gier spełniających kryteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
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
