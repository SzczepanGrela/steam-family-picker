'use client';

import React from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, Users, ExternalLink } from 'lucide-react';

export interface GameItem {
  appId: number;
  name: string;
  headerImage: string;
  genres: string[];
  ownersCount: number;
  totalPlaytime?: number;
}

interface GameCardProps {
  game: GameItem;
  currentVote: number; // 3 (must-have), 1 (interested), 0 (none)
  onVote: (appId: number, score: number) => void;
  disabled?: boolean;
}

export default function GameCard({ game, currentVote, onVote, disabled }: GameCardProps) {
  return (
    <div
      className={`group relative bg-steam-card border rounded-xl overflow-hidden flex flex-col justify-between transition-colors ${
        currentVote === 3
          ? 'border-steam-highlight shadow-[0_0_12px_-3px_rgba(255,200,44,0.35)]'
          : currentVote === 1
          ? 'border-steam-blue shadow-[0_0_12px_-3px_rgba(102,192,244,0.35)]'
          : 'border-steam-border/60 hover:border-steam-borderHover'
      }`}
    >
      {/* Header Image */}
      <div className="relative w-full aspect-[460/215] bg-steam-dark overflow-hidden">
        <Image
          src={game.headerImage}
          alt={game.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          unoptimized
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-steam-dark/90 text-[10px] font-semibold text-steam-blue border border-steam-border/50">
            <Users className="w-3 h-3" />
            <span>{game.ownersCount}</span>
          </span>
        </div>

        {/* Steam Store Link */}
        <a
          href={`https://store.steampowered.com/app/${game.appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1 rounded bg-steam-dark/80 text-steam-textMuted hover:text-white transition-colors z-10"
          title="Otwórz na Steam"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1 mb-1" title={game.name}>
            {game.name}
          </h4>

          {/* Genres Chips */}
          <div className="flex flex-wrap gap-1 mb-2.5">
            {game.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="px-1.5 py-0.2 rounded bg-steam-dark/80 text-[10px] text-steam-textMuted"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Vote Actions */}
        <div className="pt-2 border-t border-steam-border/40 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onVote(game.appId, currentVote === 3 ? 0 : 3)}
            disabled={disabled}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
              currentVote === 3
                ? 'bg-steam-highlight text-steam-dark'
                : 'bg-steam-navy/80 hover:bg-steam-highlight/20 text-steam-text hover:text-steam-highlight border border-steam-border/50'
            }`}
          >
            <Star className={`w-3 h-3 ${currentVote === 3 ? 'fill-current' : ''}`} />
            <span>Must-Have</span>
          </button>

          <button
            onClick={() => onVote(game.appId, currentVote === 1 ? 0 : 1)}
            disabled={disabled}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
              currentVote === 1
                ? 'bg-steam-blue text-steam-dark'
                : 'bg-steam-navy/80 hover:bg-steam-blue/20 text-steam-text hover:text-steam-blue border border-steam-border/50'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${currentVote === 1 ? 'fill-current' : ''}`} />
            <span>Chętnie</span>
          </button>
        </div>
      </div>
    </div>
  );
}
