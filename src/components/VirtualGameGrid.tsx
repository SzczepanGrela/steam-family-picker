'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import GameCard, { GameItem } from './GameCard';

interface VirtualGameGridProps {
  games: GameItem[];
  votes: Record<number, number>;
  onVote: (appId: number, score: number) => void;
  wishlistAppIds: number[];
}

export default function VirtualGameGrid({
  games,
  votes,
  onVote,
  wishlistAppIds,
}: VirtualGameGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(5);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);
  const [containerOffsetTop, setContainerOffsetTop] = useState(0);

  // Responsive column detection
  const updateColumns = useCallback(() => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    if (w < 640) setColumns(2);
    else if (w < 768) setColumns(3);
    else if (w < 1024) setColumns(4);
    else setColumns(5);

    setViewportHeight(window.innerHeight);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerOffsetTop(rect.top + window.scrollY);
    }
  }, []);

  useEffect(() => {
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [updateColumns]);

  // Optimized window scroll listener with requestAnimationFrame
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollTop(window.scrollY);
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerOffsetTop(rect.top + window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ample row height so action buttons never get clipped
  const rowHeight = columns <= 2 ? 305 : 320;
  const totalRows = Math.ceil(games.length / columns);
  const totalHeight = totalRows * rowHeight;

  // Overscan: render 2 extra rows above and 2 extra rows below viewport
  const relativeScroll = Math.max(0, scrollTop - containerOffsetTop);
  const overscan = 2;
  const startRow = Math.max(0, Math.floor(relativeScroll / rowHeight) - overscan);
  const endRow = Math.min(totalRows, Math.ceil((relativeScroll + viewportHeight) / rowHeight) + overscan);

  const startIndex = startRow * columns;
  const endIndex = Math.min(games.length, endRow * columns);

  const visibleGames = useMemo(() => {
    return games.slice(startIndex, endIndex).map((game, i) => {
      const absoluteIndex = startIndex + i;
      const row = Math.floor(absoluteIndex / columns);
      const col = absoluteIndex % columns;
      return {
        game,
        row,
        col,
        absoluteIndex,
      };
    });
  }, [games, startIndex, endIndex, columns]);

  const wishlistSet = useMemo(() => new Set(wishlistAppIds), [wishlistAppIds]);

  if (games.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${totalHeight}px` }}
    >
      {visibleGames.map(({ game, row, col }) => {
        const colWidthPercent = 100 / columns;
        const leftPercent = col * colWidthPercent;
        const topPx = row * rowHeight;

        return (
          <div
            key={game.appId}
            style={{
              position: 'absolute',
              top: `${topPx}px`,
              left: `${leftPercent}%`,
              width: `${colWidthPercent}%`,
              height: `${rowHeight - 12}px`,
              padding: '0 6px 12px 6px',
              contain: 'strict',
            }}
          >
            <div className="h-full">
              <GameCard
                game={game}
                currentVote={votes[game.appId] || 0}
                onVote={onVote}
                isWishlist={wishlistSet.has(game.appId)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
