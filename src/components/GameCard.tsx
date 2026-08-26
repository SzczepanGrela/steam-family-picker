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
  priceFinal?: number;
  priceFormatted?: string;
  reviewsGlobalPercent?: number;
  reviewsGlobalCount?: number;
  reviewsGlobalDesc?: string;
  reviewsPolishPercent?: number;
  reviewsPolishCount?: number;
  reviewsPolishDesc?: string;
  totalPlaytime?: number;
  isOwnedByMe?: boolean;
}

interface GameCardProps {
  game: GameItem;
  currentVote: number; // 3 (must-have), 1 (interested), 0 (none)
  onVote: (appId: number, score: number) => void;
  disabled?: boolean;
  isWishlist?: boolean;
}

export default function GameCard({ game, currentVote, onVote, disabled, isWishlist }: GameCardProps) {
  return (
    <div
      className={`h-full rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 ${
        currentVote === 3
          ? 'bg-steam-card border-2 border-steam-highlight shadow-[0_0_15px_-3px_rgba(255,200,44,0.3)]'
          : currentVote === 1
          ? 'bg-steam-card border-2 border-steam-blue shadow-[0_0_15px_-3px_rgba(102,192,244,0.3)]'
          : isWishlist
          ? 'bg-steam-card border-2 border-purple-500/60 shadow-[0_0_12px_-3px_rgba(168,85,247,0.25)]'
          : 'bg-steam-card/80 border border-steam-border/60 hover:border-steam-blue/40 hover:shadow-md'
      }`}
    >
      {/* Header Image */}
      <div className="relative w-full aspect-[460/215] bg-steam-dark overflow-hidden flex-shrink-0">
        <Image
          src={game.headerImage || `https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
          alt={game.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-t from-steam-dark/90 via-transparent to-transparent opacity-70 pointer-events-none" />

        {/* Top Left: Owners Count, Price & Wishlist Badge */}
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-[10px] font-bold text-steam-blue border border-steam-border/60 shadow-sm" title="Liczba posiadaczy w puli">
            <Users className="w-3 h-3" />
            <span>{game.ownersCount}</span>
          </span>

          {game.priceFormatted && (
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/90 text-[10px] font-bold text-white border border-steam-border/60 shadow-sm">
              {game.priceFormatted}
            </span>
          )}

          {isWishlist && (
            <span className="px-1.5 py-0.5 rounded-md bg-purple-600/95 text-[10px] font-black text-white shadow-sm border border-purple-400/40" title="Gra z Twojej listy życzeń Steam">
              💜 Wishlista
            </span>
          )}
        </div>

        {/* Top Right: Steam Store Link */}
        <a
          href={`https://store.steampowered.com/app/${game.appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1 rounded-lg bg-slate-950/90 text-steam-textMuted hover:text-white transition-colors z-10 shadow-sm"
          title="Otwórz kartę gry w sklepie Steam"
          aria-label={`Otwórz ${game.name} w sklepie Steam`}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1 mb-1.5" title={game.name}>
            {game.name}
          </h4>

          {/* Reviews Badges (World & Polish) */}
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {typeof game.reviewsGlobalPercent === 'number' && game.reviewsGlobalPercent > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  game.reviewsGlobalPercent >= 80
                    ? 'bg-blue-500/20 text-steam-blue border border-blue-500/30'
                    : 'bg-yellow-500/20 text-steam-highlight border border-yellow-500/30'
                }`}
                title={`Świat: ${game.reviewsGlobalPercent}% pozytywnych (${game.reviewsGlobalCount?.toLocaleString()} ocen) - ${game.reviewsGlobalDesc || ''}`}
              >
                🌍 {game.reviewsGlobalPercent}%
              </span>
            )}

            {typeof game.reviewsPolishPercent === 'number' && game.reviewsPolishPercent > 0 && (
              <span
                className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] font-bold"
                title={`Polska: ${game.reviewsPolishPercent}% pozytywnych (${game.reviewsPolishCount?.toLocaleString()} ocen) - ${game.reviewsPolishDesc || ''}`}
              >
                🇵🇱 {game.reviewsPolishPercent}%
              </span>
            )}

            {game.genres.slice(0, 1).map((g) => (
              <span
                key={g}
                className="px-1.5 py-0.5 rounded bg-steam-dark/80 text-[9px] text-steam-textMuted font-medium border border-steam-border/30"
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
