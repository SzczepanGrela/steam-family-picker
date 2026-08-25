'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-steam-card border border-steam-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-steam-border bg-steam-navy/80">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-steam-highlight" />
            <span>Jak odblokować bibliotekę gier Steam</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-steam-textMuted hover:text-white hover:bg-steam-border/50 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs text-steam-text">
          <p className="text-steam-textMuted">
            Aby aplikacja mogła odczytać Twoje gry, włącz publiczny dostęp do szczegółów gier:
          </p>

          <div className="space-y-2.5 bg-steam-dark/80 p-3.5 rounded-xl border border-steam-border/50">
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded bg-steam-blue/20 text-steam-blue font-bold">1</span>
              <div>
                <p className="text-white font-medium">Otwórz Ustawienia Prywatności</p>
                <a
                  href="https://steamcommunity.com/my/edit/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-steam-blue hover:underline mt-0.5"
                >
                  steamcommunity.com/my/edit/settings <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded bg-steam-blue/20 text-steam-blue font-bold">2</span>
              <div>
                <p className="text-white font-medium">Ustaw "Szczegóły gry" na "Publiczne"</p>
                <p className="text-steam-textMuted mt-0.5">
                  Wybierz opcję <strong>Publiczne (Public)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded bg-steam-blue/20 text-steam-blue font-bold">3</span>
              <div>
                <p className="text-white font-medium">Odznacz ukrywanie czasu gry</p>
                <p className="text-steam-textMuted mt-0.5">
                  Upewnij się, że opcja ukrywania czasu gry jest wyłączona.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-steam-greenDark/20 border border-steam-greenDark/40 rounded-lg text-steam-green text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Po zapisaniu kliknij „Odśwież gry” na profilu.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-steam-navy/40 border-t border-steam-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs rounded-lg transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
