'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Shield, Users, CheckCircle2, CircleDot, Trophy } from 'lucide-react';
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

export default function Navbar({ user, phase, isAdmin }: NavbarProps) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  const getPhaseBadge = (p: PhaseType) => {
    switch (p) {
      case 'registration':
        return { label: 'Faza 1: Zgłoszenia kont', color: 'bg-blue-500/20 text-steam-blue border-blue-500/30' };
      case 'voting':
        return { label: 'Faza 2: Głosowanie na gry', color: 'bg-yellow-500/20 text-steam-highlight border-yellow-500/30' };
      case 'completed':
        return { label: 'Faza 3: Wyniki & Wybór', color: 'bg-green-500/20 text-steam-green border-green-500/30' };
    }
  };

  const badge = getPhaseBadge(phase);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-steam-border/60 bg-steam-base/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-steam-blueDark to-steam-blue flex items-center justify-center shadow-glow-blue group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 text-steam-dark" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-white text-base sm:text-lg">STEAM FAMILY</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-steam-blue/20 text-steam-blue font-mono font-bold">PICKER</span>
            </div>
            <p className="text-[10px] text-steam-textMuted hidden sm:block">Optymalizator Rodziny Steam</p>
          </div>
        </Link>

        {/* Phase progress tracker */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-steam-navy/80 border border-steam-border/60 text-xs">
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium ${badge.color} border`}>
            {phase === 'completed' ? <Trophy className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5 animate-pulse" />}
            <span>{badge.label}</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Admin link */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-steam-border/60 text-steam-textMuted hover:text-white hover:bg-steam-card transition-all text-xs font-medium"
            title="Panel Administratora"
          >
            <Shield className="w-4 h-4 text-steam-highlight" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          {/* User Profile / Steam Login */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-steam-border/60">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-steam-blue shadow-sm">
                  <Image
                    src={user.avatarUrl}
                    alt={user.personaName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-medium text-white max-w-[120px] truncate">{user.personaName}</div>
                  <div className="text-[10px] text-steam-textMuted font-mono">{user.steamId.slice(-4)}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-steam-textMuted hover:text-steam-danger hover:bg-steam-danger/10 transition-colors"
                title="Wyloguj"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/api/auth/steam"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-steam-blue to-steam-blueDark text-steam-dark hover:brightness-110 font-bold text-xs shadow-glow-blue transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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
