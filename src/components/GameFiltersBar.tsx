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
  filteredCount,
}: GameFiltersBarProps) {
  return (
    <div className="space-y-3 bg-steam-card border border-steam-border p-3.5 sm:p-4 rounded-2xl shadow-lg">
      {/* Top row: Search + Import + Sort */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-textMuted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Szukaj gry..."
            className="w-full pl-9 pr-9 py-2 bg-steam-dark border border-steam-border rounded-xl text-xs text-white placeholder-steam-textMuted focus:outline-none focus:border-steam-blue"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-steam-textMuted hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {onImportWishlist && (
            <button
              onClick={onImportWishlist}
              disabled={isImportingWishlist}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-steam-blue/20 hover:bg-steam-blue/30 text-steam-blue border border-steam-blue/40 text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
              title="Importuje Twoją publiczną wishlistę ze Steam"
            >
              <Download className={`w-3.5 h-3.5 ${isImportingWishlist ? 'animate-bounce' : ''}`} />
              <span>{isImportingWishlist ? 'Importowanie...' : 'Importuj Wishlistę'}</span>
            </button>
          )}

          {/* Sort */}
          <div className="relative flex items-center">
            <div className="absolute left-2.5 pointer-events-none text-steam-textMuted">
              <ArrowUpDown className="w-3 h-3" />
            </div>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="pl-8 pr-6 py-2 bg-steam-dark border border-steam-border rounded-xl text-xs text-white focus:outline-none focus:border-steam-blue cursor-pointer appearance-none"
            >
              <option value="owners">Najwięcej posiadaczy</option>
              <option value="playtime">Najwięcej ograne</option>
              <option value="name">Alfabetycznie (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom row: Filter Chips & Genre */}
      <div className="flex flex-col lg:flex-row gap-2.5 items-start lg:items-center justify-between pt-2 border-t border-steam-border/40 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => onVoteFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              voteFilter === 'all' ? 'bg-steam-blue text-steam-dark font-bold' : 'bg-steam-dark text-steam-textMuted hover:text-white'
            }`}
          >
            Wszystkie ({filteredCount})
          </button>
          <button
            onClick={() => onVoteFilterChange('voted')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              voteFilter === 'voted' ? 'bg-steam-blue text-steam-dark font-bold' : 'bg-steam-dark text-steam-textMuted hover:text-white'
            }`}
          >
            Moje wybrane
          </button>
          <button
            onClick={() => onVoteFilterChange('must')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              voteFilter === 'must' ? 'bg-steam-highlight text-steam-dark font-bold' : 'bg-steam-dark text-steam-textMuted hover:text-steam-highlight'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Must-Have</span>
          </button>
          <button
            onClick={() => onVoteFilterChange('interested')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              voteFilter === 'interested' ? 'bg-steam-blue text-steam-dark font-bold' : 'bg-steam-dark text-steam-textMuted hover:text-steam-blue'
            }`}
          >
            <ThumbsUp className="w-3 h-3 fill-current" />
            <span>Chętnie</span>
          </button>
        </div>

        {/* Genre filter */}
        <div className="flex items-center gap-1.5 self-end lg:self-auto">
          <Filter className="w-3 h-3 text-steam-textMuted" />
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="px-2.5 py-1 bg-steam-dark border border-steam-border rounded-lg text-xs text-white focus:outline-none focus:border-steam-blue cursor-pointer"
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
