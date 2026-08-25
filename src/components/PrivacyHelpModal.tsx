'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle2, Check, ArrowRight } from 'lucide-react';

interface PrivacyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyHelpModal({ isOpen, onClose }: PrivacyHelpModalProps) {
  // Handle escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-steam-card border border-steam-border rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-steam-border bg-steam-navy/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-steam-highlight/20 text-steam-highlight">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="privacy-modal-title" className="font-bold text-white text-base">
                Jak odblokować bibliotekę gier na Steam
              </h3>
              <p className="text-[11px] text-steam-textMuted">Instrukcja zmiany widoczności w 10 sekund</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-steam-textMuted hover:text-white hover:bg-steam-border/50 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-steam-text">
          {/* Quick Direct Link Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-steam-blue/10 border border-steam-blue/30 rounded-2xl">
            <span className="text-white font-medium text-xs text-center sm:text-left">
              1. Kliknij link, aby przejść wprost do ustawień swojego profilu:
            </span>
            <a
              href="https://steamcommunity.com/my/edit/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap active:scale-95 flex-shrink-0"
            >
              <span>Otwórz Ustawienia Steam</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Visual Steam UI Mockup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-steam-textMuted font-semibold uppercase tracking-wider px-1">
              <span>2. Ustaw opcje dokładnie tak jak na poniższym wzorze:</span>
              <span className="text-steam-green font-mono text-[10px]">Wzór z aplikacji Steam</span>
            </div>

            {/* Steam Client Mockup Container */}
            <div className="rounded-2xl border border-steam-border bg-[#171d25] p-4 sm:p-5 space-y-4 shadow-inner font-sans">
              {/* Fake Steam UI Header */}
              <div className="border-b border-steam-border/40 pb-2.5 flex items-center justify-between">
                <span className="text-white font-bold text-xs tracking-wide">USTAWIENIA PRYWATNOŚCI</span>
                <span className="text-[10px] text-steam-textMuted bg-steam-dark px-2 py-0.5 rounded border border-steam-border/40">Profil Steam</span>
              </div>

              {/* Setting 1: My Profile */}
              <div className="space-y-1">
                <label className="text-[11px] text-steam-text font-medium block">Mój profil</label>
                <div className="w-full sm:w-64 px-3 py-1.5 bg-[#222b35] border border-[#3d4450] rounded text-white text-xs flex items-center justify-between opacity-80">
                  <span>Publiczny</span>
                  <span className="text-[10px] text-steam-textMuted">▼</span>
                </div>
              </div>

              {/* Setting 2: Game Details (HIGHLIGHTED) */}
              <div className="relative p-3 rounded-xl bg-steam-green/10 border-2 border-steam-green shadow-[0_0_15px_-3px_rgba(163,207,35,0.3)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-steam-green" />
                    <span>Szczegóły gry</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-steam-green text-steam-dark uppercase tracking-wider animate-pulse">
                    Wymagane: Publiczne
                  </span>
                </div>

                <div className="w-full sm:w-64 px-3 py-2 bg-[#1b2838] border-2 border-steam-green rounded-lg text-white font-bold text-xs flex items-center justify-between shadow-sm">
                  <span className="text-steam-green flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Publiczne
                  </span>
                  <span className="text-[10px] text-steam-green">▼</span>
                </div>
                <p className="text-[10px] text-steam-textMuted italic">
                  Obejmuje listę wszystkich posiadanych gier na koncie oraz gry dodane do listy życzeń.
                </p>

                {/* Subsetting: Playtime checkbox (Must be UNCHECKED) */}
                <div className="pt-2 border-t border-steam-green/20 flex items-start gap-2 text-[11px] text-white">
                  <div className="w-4 h-4 rounded border-2 border-steam-border bg-[#222b35] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {/* Unchecked box */}
                  </div>
                  <div className="text-steam-text">
                    <span className="font-semibold text-white">Zawsze ukrywaj całkowity czas gry...</span>
                    <span className="block text-[10px] text-steam-green font-medium">(Zostaw to pole puste / odznaczone)</span>
                  </div>
                </div>
              </div>

              {/* Fake Steam Auto-save notice */}
              <div className="text-[10px] text-steam-textMuted flex items-center gap-1.5 pt-1">
                <Check className="w-3 h-3 text-steam-blue" />
                <span>Zmiany na stronie Steam zapisują się automatycznie natychmiast po wybraniu opcji.</span>
              </div>
            </div>
          </div>

          {/* Step 3: Refresh Info */}
          <div className="flex items-center gap-2.5 p-3 bg-steam-greenDark/20 border border-steam-greenDark/40 rounded-xl text-steam-green text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>3. Po przestawieniu na Steam, wróć na tę stronę i kliknij przycisk „Sprawdź” / „Odśwież gry”.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-steam-navy/40 border-t border-steam-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Rozumiem, zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
