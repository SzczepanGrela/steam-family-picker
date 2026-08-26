'use client';

import React, { useState } from 'react';
import { Info, HelpCircle, X, Sparkles, Scale, Trophy, CheckCircle2 } from 'lucide-react';

interface VotingRulesModalProps {
  triggerText?: string;
  compact?: boolean;
}

export default function VotingRulesModal({ triggerText = 'Jak wyłaniamy zwycięzców?', compact = false }: VotingRulesModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Pill / Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`group inline-flex items-center gap-1.5 rounded-2xl bg-steam-navy/80 hover:bg-steam-card border border-steam-border text-steam-textMuted hover:text-white transition-all shadow-sm ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs font-semibold'
        }`}
        title="Kliknij, aby dowiedzieć się, jak wyliczany jest sprawiedliwy wynik głosowania"
      >
        <HelpCircle className="w-3.5 h-3.5 text-steam-blue group-hover:scale-110 transition-transform" />
        <span>{triggerText}</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-steam-card border border-steam-border rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-steam-border/40 pb-3">
              <div className="flex items-center gap-2.5 text-steam-blue">
                <div className="p-2 rounded-xl bg-steam-blue/20">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Jak wyłaniamy zwycięskie biblioteki?</h3>
                  <p className="text-xs text-steam-textMuted">Zasady sprawiedliwego podliczania głosów</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-steam-textMuted hover:text-white hover:bg-steam-dark transition-colors"
                aria-label="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Rules */}
            <div className="space-y-3.5 text-xs text-steam-text leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-steam-dark/80 border border-steam-border/50 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-steam-blue text-steam-dark flex items-center justify-center text-[11px] font-black">1</span>
                  <span>Równa siła głosu każdego gracza (Maks. 100 pkt)</span>
                </div>
                <p className="text-steam-textMuted pl-7">
                  Każdy głosujący dysponuje taką samą siłą wpływu na ostateczny ranking. Nikt nie może faworyzować jednego konta ponad dopuszczalny limit 100 punktów.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-steam-dark/80 border border-steam-border/50 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-steam-highlight text-steam-dark flex items-center justify-center text-[11px] font-black">2</span>
                  <span>Krok 1: Wybór gier (Must-Have = ⭐ 3 pkt, Chętnie = 👍 1 pkt)</span>
                </div>
                <p className="text-steam-textMuted pl-7">
                  Zaznaczając gry, asystent podlicza, które biblioteki wnoszą najwięcej Twoich wymarzonych tytułów i automatycznie proponuje dla nich wyższy priorytet.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-steam-dark/80 border border-steam-border/50 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-steam-green text-steam-dark flex items-center justify-center text-[11px] font-black">3</span>
                  <span>Krok 2: Hierarchia poziomów priorytetu (Poziomy 1 – 4)</span>
                </div>
                <p className="text-steam-textMuted pl-7">
                  Konta ułożone na Poziomie 1 otrzymują od Ciebie najwięcej punktów rankingowych. Im wyżej umieścisz dane konto względem pozostałych, tym większą przewagę mu dajesz.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-steam-navy/60 border border-steam-blue/30 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-steam-green" />
                  <span>Odporność na remisy i manipulacje (Metoda Rang Uśrednionych)</span>
                </div>
                <p className="text-steam-textMuted pl-6">
                  Jeśli umieścisz wszystkie konta na tym samym poziomie (np. wszystkim dasz Poziom 1), system przypisuje każdemu z nich <strong>punkty neutralne ze środka stawki (50 pkt)</strong>. Taki głos jest w 100% sprawiedliwy i nie daje żadnemu kontu niezasłużonej przewagi.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-steam-border/40">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Rozumiem
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
