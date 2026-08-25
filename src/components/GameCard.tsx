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
      className={`group relative rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
        currentVote === 3
          ? 'bg-steam-card border-2 border-steam-highlight shadow-[0_0_20px_-3px_rgba(255,200,44,0.4)] scale-[1.02]'
          : currentVote === 1
          ? 'bg-steam-card border-2 border-steam-blue shadow-[0_0_20px_-3px_rgba(102,192,244,0.4)] scale-[1.02]'
          : 'bg-steam-card/80 border border-steam-border/60 hover:border-steam-blue/40 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Header Image */}
      <div className="relative w-full aspect-[460/215] bg-steam-dark overflow-hidden">
        <Image
          src={game.headerImage || `https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
          alt={game.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-t from-steam-dark/80 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-steam-dark/90 backdrop-blur-sm text-[10px] font-bold text-steam-blue border border-steam-border/50 shadow-sm">
            <Users className="w-3 h-3" />
            <span>{game.ownersCount}</span>
          </span>
        </div>

        {/* Steam Store Link */}
        <a
          href={`https://store.steampowered.com/app/${game.appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-steam-dark/80 backdrop-blur-sm text-steam-textMuted hover:text-white transition-colors z-10 shadow-sm"
          title="Otwórz na Steam"
          aria-label={`Otwórz ${game.name} w sklepie Steam`}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1 mb-1.5" title={game.name}>
            {game.name}
          </h4>

          {/* Genres Chips */}
          <div className="flex flex-wrap gap-1">
            {game.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 rounded-md bg-steam-dark/70 text-[10px] text-steam-textMuted font-medium border border-steam-border/30"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Vote Actions */}
        <div className="pt-2.5 border-t border-steam-border/40 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onVote(game.appId, currentVote === 3 ? 0 : 3)}
            disabled={disabled}
            aria-label={`Głosuj na ${game.name} jako Must-Have`}
            aria-pressed={currentVote === 3}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              currentVote === 3
                ? 'bg-steam-highlight text-steam-dark shadow-sm'
                : 'bg-steam-navy/80 hover:bg-steam-highlight/20 text-steam-text hover:text-steam-highlight border border-steam-border/50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${currentVote === 3 ? 'fill-current' : ''}`} />
            <span>Must-Have</span>
          </button>

          <button
            onClick={() => onVote(game.appId, currentVote === 1 ? 0 : 1)}
            disabled={disabled}
            aria-label={`Głosuj na ${game.name} jako Chętnie`}
            aria-pressed={currentVote === 1}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              currentVote === 1
                ? 'bg-steam-blue text-steam-dark shadow-sm'
                : 'bg-steam-navy/80 hover:bg-steam-blue/20 text-steam-text hover:text-steam-blue border border-steam-border/50'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${currentVote === 1 ? 'fill-current' : ''}`} />
            <span>Chętnie</span>
          </button>
        </div>
      </div>
    </div>
  );
}
