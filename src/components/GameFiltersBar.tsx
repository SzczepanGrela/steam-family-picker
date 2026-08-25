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
    <div className="space-y-3.5 bg-steam-card border border-steam-border p-4 rounded-3xl shadow-xl">
      {/* Top row: Search + Import + Sort */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-textMuted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Szukaj gry po tytule..."
            className="w-full pl-10 pr-9 py-2.5 bg-steam-dark border border-steam-border rounded-2xl text-xs text-white placeholder-steam-textMuted focus:outline-none focus:border-steam-blue"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-steam-textMuted hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Buttons & Sort selector */}
        <div className="flex flex-wrap items-center gap-2">
          {onImportWishlist && (
            <button
              onClick={onImportWishlist}
              disabled={isImportingWishlist}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-steam-blue/20 hover:bg-steam-blue/30 text-steam-blue border border-steam-blue/40 text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap active:scale-95 shadow-sm"
              title="Importuje Twoją publiczną listę życzeń ze Steam"
            >
              <Download className={`w-3.5 h-3.5 ${isImportingWishlist ? 'animate-bounce' : ''}`} />
              <span>{isImportingWishlist ? 'Pobieranie...' : 'Importuj Wishlistę'}</span>
            </button>
          )}

          {/* 9 Sort Options */}
          <div className="relative flex items-center flex-1 sm:flex-initial">
            <div className="absolute left-3 pointer-events-none text-steam-textMuted">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-steam-dark border border-steam-border rounded-2xl text-xs text-white focus:outline-none focus:border-steam-blue cursor-pointer appearance-none font-medium"
            >
              <option value="popular">🌟 Najpopularniejsze (oceny)</option>
              <option value="score_world">🌍 Najwyżej oceniane (Świat %)</option>
              <option value="score_pl">🇵🇱 Najwyżej oceniane (Polska %)</option>
              <option value="price_desc">💰 Najdroższe (od najwyższej)</option>
              <option value="price_asc">🏷️ Najtańsze (od najniższej)</option>
              <option value="owners">👥 Posiadacze w puli</option>
              <option value="playtime">⏱️ Najwięcej ograne</option>
              <option value="name_asc">🔤 Alfabetycznie (A – Z)</option>
              <option value="name_desc">🔤 Alfabetycznie (Z – A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom row: Filter Chips & Genre */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between pt-2.5 border-t border-steam-border/40 text-xs">
        {/* Vote filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onVoteFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              voteFilter === 'all' 
                ? 'bg-steam-blue text-steam-dark shadow-sm' 
                : 'bg-steam-dark text-steam-textMuted hover:text-white border border-steam-border/40'
            }`}
          >
            Wszystkie ({filteredCount})
          </button>
          <button
            onClick={() => onVoteFilterChange('voted')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              voteFilter === 'voted' 
                ? 'bg-steam-blue text-steam-dark shadow-sm' 
                : 'bg-steam-dark text-steam-textMuted hover:text-white border border-steam-border/40'
            }`}
          >
            Moje wybrane
          </button>
          <button
            onClick={() => onVoteFilterChange('must')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              voteFilter === 'must' 
                ? 'bg-steam-highlight text-steam-dark shadow-sm' 
                : 'bg-steam-dark text-steam-textMuted hover:text-steam-highlight border border-steam-border/40'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Must-Have</span>
          </button>
          <button
            onClick={() => onVoteFilterChange('interested')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              voteFilter === 'interested' 
                ? 'bg-steam-blue text-steam-dark shadow-sm' 
                : 'bg-steam-dark text-steam-textMuted hover:text-steam-blue border border-steam-border/40'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            <span>Chętnie</span>
          </button>
        </div>

        {/* Genre filter dropdown */}
        <div className="flex items-center gap-2 self-stretch sm:self-end lg:self-auto">
          <Filter className="w-3.5 h-3.5 text-steam-textMuted flex-shrink-0" />
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-steam-dark border border-steam-border rounded-xl text-xs text-white focus:outline-none focus:border-steam-blue cursor-pointer font-medium"
          >
            <option value="all">Wszystkie tagi/gatunki ({genres.length})</option>
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
