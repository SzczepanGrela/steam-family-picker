'use client';

import React from 'react';
import { Search, Filter, ArrowUpDown, X, Download, Star, ThumbsUp, Trash2, EyeOff, CheckSquare, Square } from 'lucide-react';

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
  hideOwned: boolean;
  onHideOwnedChange: (val: boolean) => void;
  onImportWishlist?: () => void;
  isImportingWishlist?: boolean;
  onClearAllVotes?: () => void;
  selectedVotesCount?: number;
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
  hideOwned,
  onHideOwnedChange,
  onImportWishlist,
  isImportingWishlist,
  onClearAllVotes,
  selectedVotesCount = 0,
  filteredCount,
}: GameFiltersBarProps) {
  return (
    <div className="space-y-3.5 bg-steam-card border border-steam-border p-4 rounded-3xl shadow-xl">
      {/* Top row: Search + Import + Clear + Sort */}
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

        {/* Action Buttons & Sort selector */}
        <div className="flex flex-wrap items-center gap-2">
          {onImportWishlist && (
            <button
              onClick={onImportWishlist}
              disabled={isImportingWishlist}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap active:scale-95 shadow-sm"
              title="Importuje Twoją listę życzeń ze Steam przez oficjalne API"
            >
              <Download className={`w-3.5 h-3.5 ${isImportingWishlist ? 'animate-bounce' : ''}`} />
              <span>{isImportingWishlist ? 'Pobieranie...' : 'Importuj Wishlistę'}</span>
            </button>
          )}

          {onClearAllVotes && selectedVotesCount > 0 && (
            <button
              onClick={onClearAllVotes}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-steam-danger/15 hover:bg-steam-danger/30 text-steam-danger border border-steam-danger/30 text-xs font-bold transition-all whitespace-nowrap active:scale-95 shadow-sm"
              title="Usuń wszystkie zaznaczone Must-Have i Chętnie"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wyczyść wybory ({selectedVotesCount})</span>
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

      {/* Bottom row: Filter Chips, Hide Owned Checkbox & Genre */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between pt-2.5 border-t border-steam-border/40 text-xs">
        {/* Left: Vote filter pills + Hide Owned Checkbox */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vote filter pills */}
          <div className="flex items-center gap-1 bg-steam-dark p-1 rounded-2xl border border-steam-border/50">
            <button
              onClick={() => onVoteFilterChange('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                voteFilter === 'all' 
                  ? 'bg-steam-blue text-steam-dark shadow-sm' 
                  : 'text-steam-textMuted hover:text-white'
              }`}
            >
              Wszystkie ({filteredCount})
            </button>
            <button
              onClick={() => onVoteFilterChange('voted')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                voteFilter === 'voted' 
                  ? 'bg-steam-blue text-steam-dark shadow-sm' 
                  : 'text-steam-textMuted hover:text-white'
              }`}
            >
              Moje wybrane
            </button>
            <button
              onClick={() => onVoteFilterChange('must')}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all ${
                voteFilter === 'must' 
                  ? 'bg-steam-highlight text-steam-dark shadow-sm' 
                  : 'text-steam-textMuted hover:text-steam-highlight'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Must-Have</span>
            </button>
            <button
              onClick={() => onVoteFilterChange('interested')}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all ${
                voteFilter === 'interested' 
                  ? 'bg-steam-blue text-steam-dark shadow-sm' 
                  : 'text-steam-textMuted hover:text-steam-blue'
              }`}
            >
              <ThumbsUp className="w-3 h-3 fill-current" />
              <span>Chętnie</span>
            </button>
          </div>

          {/* Hide Owned Toggle */}
          <button
            onClick={() => onHideOwnedChange(!hideOwned)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border font-bold transition-all ${
              hideOwned
                ? 'bg-steam-green/20 text-steam-green border-steam-green/40'
                : 'bg-steam-dark text-steam-textMuted border-steam-border/40 hover:text-white'
            }`}
            title="Ukrywa gry, które posiadasz już na swoim koncie Steam"
          >
            {hideOwned ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span>Ukryj moje gry</span>
          </button>
        </div>

        {/* Right: Genre filter dropdown */}
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
