'use client';

import React from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, Users, ExternalLink, Clock } from 'lucide-react';

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
  const formatPlaytime = (minutes?: number) => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.round(minutes / 60);
    return `${hours}h łącznie`;
  };

  const playtimeStr = formatPlaytime(game.totalPlaytime);

  return (
    <div
      className={`group relative bg-steam-card border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
        currentVote === 3
          ? 'border-steam-highlight/80 shadow-[0_0_15px_-3px_rgba(255,200,44,0.3)] bg-gradient-to-b from-steam-card to-[#28251e]'
          : currentVote === 1
          ? 'border-steam-blue/80 shadow-[0_0_15px_-3px_rgba(102,192,244,0.3)] bg-gradient-to-b from-steam-card to-[#182633]'
          : 'border-steam-border/60 hover:border-steam-borderHover hover:shadow-lg'
      }`}
    >
      {/* Header Image with overlay tags */}
      <div className="relative w-full aspect-[460/215] bg-steam-dark overflow-hidden">
        <Image
          src={game.headerImage}
          alt={game.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-t from-steam-card via-transparent to-transparent opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-steam-dark/80 backdrop-blur-md text-[11px] font-semibold text-steam-blue border border-steam-border/50">
            <Users className="w-3 h-3" />
            <span>{game.ownersCount} {game.ownersCount === 1 ? 'konto' : 'konta'}</span>
          </span>

          {playtimeStr && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-steam-dark/80 backdrop-blur-md text-[11px] text-steam-textMuted border border-steam-border/50">
              <Clock className="w-3 h-3" />
              <span>{playtimeStr}</span>
            </span>
          )}
        </div>

        {/* Steam Store Link */}
        <a
          href={`https://store.steampowered.com/app/${game.appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1.5 rounded-md bg-steam-dark/80 backdrop-blur-md text-steam-textMuted hover:text-white hover:bg-steam-blueDark/80 border border-steam-border/50 transition-colors z-10"
          title="Zobacz na Steam"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Content Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1 mb-1.5 group-hover:text-steam-blue transition-colors" title={game.name}>
            {game.name}
          </h4>

          {/* Genres Chips */}
          <div className="flex flex-wrap gap-1 mb-3">
            {game.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="px-1.5 py-0.5 rounded bg-steam-navy/80 border border-steam-border/40 text-[10px] text-steam-textMuted"
              >
                {g}
              </span>
            ))}
            {game.genres.length > 3 && (
              <span className="text-[10px] text-steam-textMuted px-1 py-0.5">+{game.genres.length - 3}</span>
            )}
          </div>
        </div>

        {/* Voting Action Buttons */}
        <div className="pt-3 border-t border-steam-border/40 grid grid-cols-2 gap-2">
          {/* Must-have (3 pts) */}
          <button
            onClick={() => onVote(game.appId, currentVote === 3 ? 0 : 3)}
            disabled={disabled}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
              currentVote === 3
                ? 'bg-steam-highlight text-steam-dark shadow-[0_0_10px_rgba(255,200,44,0.5)]'
                : 'bg-steam-navy/80 hover:bg-steam-highlight/20 text-steam-text hover:text-steam-highlight border border-steam-border/60'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${currentVote === 3 ? 'fill-current' : ''}`} />
            <span>Must-Have</span>
          </button>

          {/* Interested (1 pt) */}
          <button
            onClick={() => onVote(game.appId, currentVote === 1 ? 0 : 1)}
            disabled={disabled}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
              currentVote === 1
                ? 'bg-steam-blue text-steam-dark shadow-glow-blue'
                : 'bg-steam-navy/80 hover:bg-steam-blue/20 text-steam-text hover:text-steam-blue border border-steam-border/60'
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
