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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
      {/* CARD 1: Zgłaszanie Kont */}
      <div
        className={`relative rounded-2xl p-6 border transition-all flex flex-col justify-between ${
          phase === 'registration'
            ? 'bg-card-gradient border-steam-blue/50 shadow-glow-blue scale-[1.02]'
            : 'bg-steam-card/50 border-steam-border/40 opacity-80'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                phase === 'registration'
                  ? 'bg-steam-blue/20 text-steam-blue border border-steam-blue/40'
                  : 'bg-steam-border/30 text-steam-textMuted'
              }`}
            >
              <UserPlus className="w-6 h-6" />
            </div>

            {phase === 'registration' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-steam-blue/20 text-steam-blue border border-steam-blue/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-steam-blue animate-ping" />
                Aktywny etap
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-steam-border/30 text-steam-textMuted flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Zakończone
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">1. Zgłoś swoje konto</h3>
          <p className="text-sm text-steam-textMuted leading-relaxed mb-4">
            Zaloguj się przez Steam i dołącz swoją bibliotekę gier do wspólnej puli. System automatycznie sprawdzi gry wspierające Family Sharing.
          </p>

          {isSubmitted && phase === 'registration' && (
            <div className="p-3 bg-steam-greenDark/20 border border-steam-greenDark/40 rounded-xl text-xs text-steam-green flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Twoje konto zostało pomyślnie zgłoszone!</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-steam-border/40">
          {phase === 'registration' ? (
            <Link
              href={isLoggedIn ? '/submit' : '/api/auth/steam'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-sm shadow-md transition-all group"
            >
              <span>{isSubmitted ? 'Przejdź do swojej biblioteki' : 'Zgłoś konto do puli'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-steam-navy/40 border border-steam-border/40 text-steam-textMuted text-xs font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Zgłoszenia kont są już zamknięte</span>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: Głosowanie / Preferencje */}
      <div
        className={`relative rounded-2xl p-6 border transition-all flex flex-col justify-between ${
          phase === 'voting'
            ? 'bg-card-gradient border-steam-highlight/50 shadow-[0_0_20px_-5px_rgba(255,200,44,0.3)] scale-[1.02]'
            : 'bg-steam-card/50 border-steam-border/40 opacity-80'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                phase === 'voting'
                  ? 'bg-steam-highlight/20 text-steam-highlight border border-steam-highlight/40'
                  : 'bg-steam-border/30 text-steam-textMuted'
              }`}
            >
              <Vote className="w-6 h-6" />
            </div>

            {phase === 'voting' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-steam-highlight/20 text-steam-highlight border border-steam-highlight/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-steam-highlight animate-ping" />
                Aktywny etap
              </span>
            ) : phase === 'registration' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-steam-navy/60 text-steam-textMuted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Oczekuje
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-steam-border/30 text-steam-textMuted flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Zakończone
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">2. Wybierz gry i zagłosuj</h3>
          <p className="text-sm text-steam-textMuted leading-relaxed mb-4">
            Przeglądaj połączony katalog gier, oznaczaj pozycje <strong className="text-white">Must-have (⭐)</strong> oraz importuj swoją oficjalną wishlistę ze Steam.
          </p>
        </div>

        <div className="pt-4 border-t border-steam-border/40">
          {phase === 'voting' ? (
            <Link
              href="/vote"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-bold text-sm shadow-md transition-all group"
            >
              <span>Przejdź do głosowania</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : phase === 'registration' ? (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-steam-navy/40 border border-steam-border/40 text-steam-textMuted text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-steam-highlight/70" />
              <span>Głosowanie ruszy po zebraniu kont</span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-steam-navy/40 border border-steam-border/40 text-steam-textMuted text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Głosowanie zakończone</span>
            </div>
          )}
        </div>
      </div>

      {/* CARD 3: Wyniki & Wybór */}
      <div
        className={`relative rounded-2xl p-6 border transition-all flex flex-col justify-between ${
          phase === 'completed'
            ? 'bg-card-gradient border-steam-green/50 shadow-glow-green scale-[1.02]'
            : 'bg-steam-card/50 border-steam-border/40 opacity-80'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                phase === 'completed'
                  ? 'bg-steam-green/20 text-steam-green border border-steam-green/40'
                  : 'bg-steam-border/30 text-steam-textMuted'
              }`}
            >
              <Trophy className="w-6 h-6" />
            </div>

            {phase === 'completed' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-steam-green/20 text-steam-green border border-steam-green/30 flex items-center gap-1">
                🏆 Wyniki ogłoszone!
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-steam-navy/60 text-steam-textMuted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Finał
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">3. Optymalna Rodzina</h3>
          <p className="text-sm text-steam-textMuted leading-relaxed mb-4">
            Matematyczny algorytm wybiera 4 konta dające najwyższe zadowolenie całej grupy oraz generuje listę gier offline dla pozostałych kont.
          </p>
        </div>

        <div className="pt-4 border-t border-steam-border/40">
          {phase === 'completed' ? (
            <a
              href="#results-section"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-steam-green hover:bg-lime-400 text-steam-dark font-bold text-sm shadow-md transition-all group"
            >
              <span>Zobacz zwycięską czwórkę</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-steam-navy/40 border border-steam-border/40 text-steam-textMuted text-xs font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Wyniki pojawią się po zakończeniu fazy 2</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
