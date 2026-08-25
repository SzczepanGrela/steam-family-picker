'use client';

import React from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PrivacyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyHelpModal({ isOpen, onClose }: PrivacyHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-steam-card border border-steam-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-steam-border bg-steam-navy/60">
          <div className="flex items-center gap-2 text-steam-blue">
            <ShieldAlert className="w-5 h-5 text-steam-highlight" />
            <h3 className="font-semibold text-lg text-white">Jak odblokować profil Steam?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-steam-textMuted hover:text-white hover:bg-steam-border/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-steam-text">
          <p>
            Aby system mógł pobrać Twoje gry i sprawdzić, które z nich wspierają Rodzinę Steam, Twoja biblioteka gier musi być ustawiona na <strong className="text-white">Publiczną</strong>.
          </p>

          <div className="space-y-3 bg-steam-dark/60 p-4 rounded-lg border border-steam-border/50">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-steam-blue/20 text-steam-blue text-xs font-bold">1</span>
              <div>
                <p className="text-white font-medium">Otwórz Ustawienia Prywatności Steam</p>
                <a
                  href="https://steamcommunity.com/my/edit/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-steam-blue hover:underline mt-1"
                >
                  steamcommunity.com/my/edit/settings <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-steam-blue/20 text-steam-blue text-xs font-bold">2</span>
              <div>
                <p className="text-white font-medium">Ustaw "Szczegóły gry" na "Publiczne"</p>
                <p className="text-xs text-steam-textMuted mt-0.5">
                  W sekcji <em>Szczegóły gry (Game details)</em> wybierz opcję <strong>Publiczne (Public)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-steam-blue/20 text-steam-blue text-xs font-bold">3</span>
              <div>
                <p className="text-white font-medium">Odznacz ukrywanie czasu gry (opcjonalne)</p>
                <p className="text-xs text-steam-textMuted mt-0.5">
                  Upewnij się, że pole <em>"Zawsze ukrywaj mój łączny czas gry"</em> jest odznaczone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-steam-greenDark/20 border border-steam-greenDark/40 rounded-lg text-xs text-steam-green">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Po zmianie w Steam kliknij ponownie „Zgłoś konto” lub „Odśwież gry” na tej stronie.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-steam-navy/40 border-t border-steam-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-medium text-sm rounded-lg transition-colors"
          >
            Rozumiem
          </button>
        </div>
      </div>
    </div>
  );
}
