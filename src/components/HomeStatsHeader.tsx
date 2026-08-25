'use client';

import React, { useState, useEffect } from 'react';
import { Users, Gamepad2, Vote, RefreshCw } from 'lucide-react';

interface HomeStatsHeaderProps {
  initialAccountsCount: number;
  initialGamesCount: number;
  initialVotersCount: number;
  isScanning?: boolean;
}

export default function HomeStatsHeader({
  initialAccountsCount,
  initialGamesCount,
  initialVotersCount,
}: HomeStatsHeaderProps) {
  const [stats, setStats] = useState({
    accountsCount: initialAccountsCount,
    gamesCount: initialGamesCount,
    votersCount: initialVotersCount,
  });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok && isMounted) {
          const data = await res.json();
          setStats({
            accountsCount: data.accountsCount,
            gamesCount: data.gamesCount,
            votersCount: data.votersCount,
          });
          const scanning = data.queueStatus?.pending > 0 || data.queueStatus?.processing > 0;
          setIsScanning(scanning);
        }
      } catch (err) {
        console.error('Stats poll error:', err);
      }
    };

    // Initial fetch to sync
    fetchStats();

    // Poll every 3 seconds while active
    const interval = setInterval(fetchStats, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2 pb-2">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dobór Rodziny Steam
          </h1>
          {isScanning && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-steam-blue/20 text-steam-blue border border-steam-blue/40 animate-pulse">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Skanowanie...
            </span>
          )}
        </div>
        <p className="text-xs text-steam-textMuted mt-1">
          Wybór 4 kont dających najlepszą pulę gier dla wszystkich uczestników.
        </p>
      </div>

      {/* Live Counters */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex-1 md:flex-initial bg-steam-card border border-steam-border/60 px-4 py-2 rounded-xl text-center transition-all">
          <div className="text-lg font-bold text-white">{stats.accountsCount}</div>
          <div className="text-[10px] text-steam-textMuted flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-steam-blue" />
            <span>Konta</span>
          </div>
        </div>

        <div className="flex-1 md:flex-initial bg-steam-card border border-steam-border/60 px-4 py-2 rounded-xl text-center transition-all">
          <div className="text-lg font-bold text-steam-highlight">{stats.gamesCount}</div>
          <div className="text-[10px] text-steam-textMuted flex items-center justify-center gap-1">
            <Gamepad2 className="w-3 h-3 text-steam-highlight" />
            <span>Gry Family</span>
          </div>
        </div>

        <div className="flex-1 md:flex-initial bg-steam-card border border-steam-border/60 px-4 py-2 rounded-xl text-center transition-all">
          <div className="text-lg font-bold text-steam-green">{stats.votersCount}</div>
          <div className="text-[10px] text-steam-textMuted flex items-center justify-center gap-1">
            <Vote className="w-3 h-3 text-steam-green" />
            <span>Głosy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
