'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Shield, Users, Trophy, CircleDot } from 'lucide-react';
import { PhaseType } from '@/lib/db';

interface NavbarProps {
  user: {
    steamId: string;
    personaName: string;
    avatarUrl: string;
  } | null;
  phase: PhaseType;
  isAdmin?: boolean;
}

export default function Navbar({ user, phase }: NavbarProps) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  const phaseLabels: Record<PhaseType, { name: string; color: string }> = {
    registration: { name: 'Faza 1: Zgłoszenia', color: 'bg-blue-500/10 text-steam-blue border-blue-500/30' },
    voting: { name: 'Faza 2: Głosowanie', color: 'bg-yellow-500/10 text-steam-highlight border-yellow-500/30' },
    completed: { name: 'Faza 3: Wyniki', color: 'bg-green-500/10 text-steam-green border-green-500/30' },
  };

  const currentPhase = phaseLabels[phase];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-steam-border/60 bg-steam-base/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-steam-blueDark/80 flex items-center justify-center border border-steam-blue/40 group-hover:border-steam-blue transition-colors">
            <Users className="w-4 h-4 text-steam-blue" />
          </div>
          <span className="font-bold tracking-wide text-white text-sm sm:text-base">
            STEAM <span className="text-steam-blue font-mono font-semibold">FAMILY</span>
          </span>
        </Link>

        {/* Phase indicator badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentPhase.color}`}>
          {phase === 'completed' ? <Trophy className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5 animate-pulse" />}
          <span>{currentPhase.name}</span>
        </div>

        {/* User / Admin Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-steam-border/50 text-steam-textMuted hover:text-white hover:bg-steam-card transition-colors text-xs font-medium"
          >
            <Shield className="w-3.5 h-3.5 text-steam-highlight" />
            <span>Admin</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-steam-border/50">
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-steam-blue">
                <Image
                  src={user.avatarUrl}
                  alt={user.personaName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="text-xs font-medium text-white max-w-[120px] truncate hidden md:inline">
                {user.personaName}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-steam-textMuted hover:text-steam-danger hover:bg-steam-danger/10 transition-colors"
                title="Wyloguj"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/api/auth/steam"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.401-1.635 0-3.003-1.15-3.324-2.678L.484 15.01C1.942 20.244 6.746 24 12.44 24c6.627 0 12-5.373 12-12S19.066 0 12.44 0h-.461z" />
              </svg>
              <span>Zaloguj przez Steam</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
