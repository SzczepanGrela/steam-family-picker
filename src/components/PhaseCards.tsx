'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, Vote, Trophy, ArrowRight, Lock, CheckCircle, Clock } from 'lucide-react';
import { PhaseType } from '@/lib/db';

interface PhaseCardsProps {
  phase: PhaseType;
  isLoggedIn: boolean;
  isSubmitted: boolean;
}

export default function PhaseCards({ phase, isLoggedIn, isSubmitted }: PhaseCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
      {/* 1. Zgłoszenia */}
      <div
        className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
          phase === 'registration'
            ? 'bg-steam-card border-steam-blue shadow-glow-blue'
            : 'bg-steam-card/40 border-steam-border/40 opacity-70'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${phase === 'registration' ? 'bg-steam-blue/20 text-steam-blue' : 'bg-steam-border/30 text-steam-textMuted'}`}>
              <UserPlus className="w-5 h-5" />
            </div>

            {phase === 'registration' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-steam-blue/20 text-steam-blue border border-steam-blue/40">
                Aktywny
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Zakończone
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-1">1. Zgłoś konto</h3>
          <p className="text-xs text-steam-textMuted leading-relaxed mb-4">
            Dołącz swoją bibliotekę Steam. System odfiltruje gry bez Family Sharing.
          </p>

          {isSubmitted && phase === 'registration' && (
            <div className="p-2.5 bg-steam-greenDark/20 border border-steam-greenDark/40 rounded-lg text-xs text-steam-green flex items-center gap-2 mb-3">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Twoje konto jest w puli</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-steam-border/40">
          {phase === 'registration' ? (
            <Link
              href={isLoggedIn ? '/submit' : '/api/auth/steam'}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs transition-colors"
            >
              <span>{isSubmitted ? 'Moja biblioteka' : 'Zgłoś konto'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-steam-dark/60 text-steam-textMuted text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Zgłoszenia zamknięte</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Głosowanie */}
      <div
        className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
          phase === 'voting'
            ? 'bg-steam-card border-steam-highlight shadow-[0_0_15px_-3px_rgba(255,200,44,0.3)]'
            : 'bg-steam-card/40 border-steam-border/40 opacity-70'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${phase === 'voting' ? 'bg-steam-highlight/20 text-steam-highlight' : 'bg-steam-border/30 text-steam-textMuted'}`}>
              <Vote className="w-5 h-5" />
            </div>

            {phase === 'voting' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-steam-highlight/20 text-steam-highlight border border-steam-highlight/40">
                Aktywny
              </span>
            ) : phase === 'registration' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Wkrótce
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Zakończone
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-1">2. Wybierz gry</h3>
          <p className="text-xs text-steam-textMuted leading-relaxed mb-4">
            Oznacz gry, w które chcesz zagrać lub zaimportuj wishlistę ze Steam.
          </p>
        </div>

        <div className="pt-3 border-t border-steam-border/40">
          {phase === 'voting' ? (
            <Link
              href="/vote"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-bold text-xs transition-colors"
            >
              <span>Przejdź do głosowania</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : phase === 'registration' ? (
            <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-steam-dark/60 text-steam-textMuted text-xs">
              <Clock className="w-3.5 h-3.5 text-steam-highlight/70" />
              <span>Czeka na koniec zgłoszeń</span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-steam-dark/60 text-steam-textMuted text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Głosowanie zakończone</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Wyniki */}
      <div
        className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
          phase === 'completed'
            ? 'bg-steam-card border-steam-green shadow-glow-green'
            : 'bg-steam-card/40 border-steam-border/40 opacity-70'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${phase === 'completed' ? 'bg-steam-green/20 text-steam-green' : 'bg-steam-border/30 text-steam-textMuted'}`}>
              <Trophy className="w-5 h-5" />
            </div>

            {phase === 'completed' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-steam-green/20 text-steam-green border border-steam-green/40">
                Ogłoszone
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Finał
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-1">3. Wybrane konta (4/4)</h3>
          <p className="text-xs text-steam-textMuted leading-relaxed mb-4">
            Optymalny dobór 4 bibliotek o najwyższym pokryciu gier dla wszystkich.
          </p>
        </div>

        <div className="pt-3 border-t border-steam-border/40">
          {phase === 'completed' ? (
            <a
              href="#results-section"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-green hover:bg-lime-400 text-steam-dark font-bold text-xs transition-colors"
            >
              <span>Zobacz zestawienie</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-steam-dark/60 text-steam-textMuted text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Dostępne po fazie 2</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
