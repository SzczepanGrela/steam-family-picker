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
        className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 ${
          phase === 'registration'
            ? 'steam-glass-card border-steam-blue/60 shadow-[0_0_25px_-5px_rgba(102,192,244,0.3)] hover:scale-[1.01]'
            : 'bg-steam-card/40 border-steam-border/40 opacity-70 hover:opacity-90'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${phase === 'registration' ? 'bg-steam-blue/20 text-steam-blue shadow-glow-blue' : 'bg-steam-border/30 text-steam-textMuted'}`}>
              <UserPlus className="w-5 h-5" />
            </div>

            {phase === 'registration' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-steam-blue/20 text-steam-blue border border-steam-blue/50 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-steam-blue" />
                Aktywny
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-steam-green" /> Zakończone
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
            <span>1. Zgłoś konto</span>
          </h3>
          <p className="text-xs text-steam-textMuted leading-relaxed mb-4">
            Dołącz swoją bibliotekę Steam. System automatycznie odfiltruje gry bez obsługi Family Sharing.
          </p>

          {isSubmitted && phase === 'registration' && (
            <div className="p-2.5 bg-steam-greenDark/20 border border-steam-greenDark/40 rounded-xl text-xs text-steam-green flex items-center gap-2 mb-3">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Twoje konto jest zgłoszone w puli</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-steam-border/40">
          {phase === 'registration' ? (
            isLoggedIn ? (
              <Link
                href="/submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                <span>{isSubmitted ? 'Moja biblioteka' : 'Zgłoś konto'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <a
                href="/api/auth/steam"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                <span>Zgłoś konto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-steam-dark/60 border border-steam-border/30 text-steam-textMuted text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Zgłoszenia zamknięte</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Głosowanie */}
      <div
        className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 ${
          phase === 'voting'
            ? 'steam-glass-card border-steam-highlight/60 shadow-[0_0_25px_-5px_rgba(255,200,44,0.3)] hover:scale-[1.01]'
            : 'bg-steam-card/40 border-steam-border/40 opacity-70 hover:opacity-90'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${phase === 'voting' ? 'bg-steam-highlight/20 text-steam-highlight shadow-[0_0_15px_rgba(255,200,44,0.3)]' : 'bg-steam-border/30 text-steam-textMuted'}`}>
              <Vote className="w-5 h-5" />
            </div>

            {phase === 'voting' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-steam-highlight/20 text-steam-highlight border border-steam-highlight/50 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-steam-highlight" />
                Aktywny
              </span>
            ) : phase === 'registration' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <Clock className="w-3 h-3 text-steam-highlight/70" /> Wkrótce
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-steam-green" /> Zakończone
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
            <span>2. Głosowanie na biblioteki</span>
          </h3>
          <p className="text-xs text-steam-textMuted leading-relaxed mb-4">
            Wskaż gry, które Cię interesują i ułóż preferowaną kolejność bibliotek znajomych.
          </p>
        </div>

        <div className="pt-4 border-t border-steam-border/40">
          {phase === 'voting' ? (
            <Link
              href="/vote"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-bold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <span>Przejdź do głosowania</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : phase === 'registration' ? (
            <div className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-steam-dark/60 border border-steam-border/30 text-steam-textMuted text-xs">
              <Clock className="w-3.5 h-3.5 text-steam-highlight/70" />
              <span>Czeka na koniec zgłoszeń</span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-steam-dark/60 border border-steam-border/30 text-steam-textMuted text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-steam-green" />
              <span>Głosowanie zakończone</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Wyniki */}
      <div
        className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 ${
          phase === 'completed'
            ? 'steam-glass-card border-steam-green/60 shadow-[0_0_25px_-5px_rgba(163,207,35,0.3)] hover:scale-[1.01]'
            : 'bg-steam-card/40 border-steam-border/40 opacity-70 hover:opacity-90'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${phase === 'completed' ? 'bg-steam-green/20 text-steam-green shadow-glow-green' : 'bg-steam-border/30 text-steam-textMuted'}`}>
              <Trophy className="w-5 h-5" />
            </div>

            {phase === 'completed' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-steam-green/20 text-steam-green border border-steam-green/50 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Ogłoszone
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs text-steam-textMuted bg-steam-navy border border-steam-border/40 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Finał
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
            <span>3. Oficjalny Ranking</span>
          </h3>
          <p className="text-xs text-steam-textMuted leading-relaxed mb-4">
            Oficjalny ranking bibliotek wyłoniony na podstawie preferencji społeczności i zawartości gier.
          </p>
        </div>

        <div className="pt-4 border-t border-steam-border/40">
          {phase === 'completed' ? (
            <a
              href="#results-section"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-green hover:bg-lime-400 text-steam-dark font-bold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <span>Zobacz zestawienie</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-steam-dark/60 border border-steam-border/30 text-steam-textMuted text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Dostępne po fazie 2</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
