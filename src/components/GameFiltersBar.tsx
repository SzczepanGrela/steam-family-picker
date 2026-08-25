'use client';

import React from 'react';
import { Search, Filter, ArrowUpDown, X, Download, Star, ThumbsUp } from 'lucide-react';

interface GameFiltersBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedGenre: string;
  onGenreChange: (val: string) => void;
  genres: string[];
  sort: string;
  onSortChange: (val: string) => void;
  voteFilter: 'all' | 'voted' | 'must' | 'interested';
  onVoteFilterChange: (val: 'all' | 'voted' | 'must' | 'interested') => void;
  onImportWishlist?: () => void;
  isImportingWishlist?: boolean;
  totalGames: number;
  filteredCount: number;
}

export default function GameFiltersBar({
  search,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres,
  sort,
  onSortChange,
  voteFilter,
  onVoteFilterChange,
  onImportWishlist,
  isImportingWishlist,
  totalGames,
  filteredCount,
}: GameFiltersBarProps) {
  return (
    <div className="space-y-4 bg-steam-card/90 border border-steam-border p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-md">
      {/* Top row: Search + Wishlist Import + Sort */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-textMuted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Szukaj gry (np. Cyberpunk, Witcher, Baldur's Gate)..."
            className="w-full pl-10 pr-10 py-2.5 bg-steam-dark/90 border border-steam-border rounded-xl text-sm text-white placeholder-steam-textMuted/70 focus:outline-none focus:border-steam-blue focus:ring-1 focus:ring-steam-blue transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-steam-textMuted hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons: Import Wishlist + Sort */}
        <div className="flex items-center gap-2.5">
          {onImportWishlist && (
            <button
              onClick={onImportWishlist}
              disabled={isImportingWishlist}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-steam-blue/20 hover:bg-steam-blue/30 text-steam-blue border border-steam-blue/40 text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
              title="Importuje Twoją publiczną listę życzeń ze Steam i oznacza gry jako Must-Have (⭐)"
            >
              <Download className={`w-4 h-4 ${isImportingWishlist ? 'animate-bounce' : ''}`} />
              <span>{isImportingWishlist ? 'Importowanie...' : 'Importuj Wishlistę Steam'}</span>
            </button>
          )}

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none text-steam-textMuted">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-steam-dark/90 border border-steam-border rounded-xl text-xs font-medium text-white focus:outline-none focus:border-steam-blue cursor-pointer appearance-none"
            >
              <option value="owners">Najwięcej posiadaczy</option>
              <option value="playtime">Najwięcej ograne</option>
              <option value="name">Alfabetycznie (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom row: Vote Filter Chips & Genres */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between pt-3 border-t border-steam-border/50 text-xs">
        {/* Vote state filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-steam-textMuted mr-1 font-medium">Filtr:</span>
          <button
            onClick={() => onVoteFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              voteFilter === 'all'
                ? 'bg-steam-blue text-steam-dark font-bold shadow-glow-blue'
                : 'bg-steam-dark text-steam-textMuted hover:text-white border border-steam-border/50'
            }`}
          >
            Wszystkie ({filteredCount})
          </button>
          <button
            onClick={() => onVoteFilterChange('voted')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              voteFilter === 'voted'
                ? 'bg-steam-blue text-steam-dark font-bold'
                : 'bg-steam-dark text-steam-textMuted hover:text-white border border-steam-border/50'
            }`}
          >
            Moje wybrane
          </button>
          <button
            onClick={() => onVoteFilterChange('must')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
              voteFilter === 'must'
                ? 'bg-steam-highlight text-steam-dark font-bold shadow-sm'
                : 'bg-steam-dark text-steam-textMuted hover:text-steam-highlight border border-steam-border/50'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Must-Have</span>
          </button>
          <button
            onClick={() => onVoteFilterChange('interested')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
              voteFilter === 'interested'
                ? 'bg-steam-blue text-steam-dark font-bold shadow-sm'
                : 'bg-steam-dark text-steam-textMuted hover:text-steam-blue border border-steam-border/50'
            }`}
          >
            <ThumbsUp className="w-3 h-3 fill-current" />
            <span>Chętnie</span>
          </button>
        </div>

        {/* Genre filter dropdown */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Filter className="w-3.5 h-3.5 text-steam-textMuted" />
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="px-3 py-1.5 bg-steam-dark border border-steam-border rounded-lg text-xs text-white focus:outline-none focus:border-steam-blue cursor-pointer"
          >
            <option value="all">Wszystkie gatunki ({genres.length})</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
