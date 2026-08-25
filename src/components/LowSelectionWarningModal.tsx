'use client';

import React from 'react';
import { AlertCircle, ArrowRight, PlusCircle, X } from 'lucide-react';

interface LowSelectionWarningModalProps {
  isOpen: boolean;
  selectedCount: number;
  onProceed: () => void;
  onCancel: () => void;
}

export default function LowSelectionWarningModal({
  isOpen,
  selectedCount,
  onProceed,
  onCancel,
}: LowSelectionWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-steam-card border border-steam-border rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-steam-border bg-steam-navy/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-steam-highlight">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Mała liczba wybranych gier</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-steam-textMuted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-steam-text">
          <p className="text-steam-text leading-relaxed">
            Zaznaczyłeś obecnie tylko <strong className="text-steam-highlight font-bold">{selectedCount}</strong> {selectedCount === 1 ? 'grę' : 'gry'}.
          </p>
          <p className="text-steam-textMuted leading-relaxed">
            Sugerowana kolejność bibliotek znajomych jest najbardziej precyzyjna, gdy wskażesz przynajmniej <strong>5 tytułów</strong> lub zaimportujesz swoją wishlistę.
          </p>
          <p className="text-white font-medium">
            Możesz przejść do układania kont od razu lub wrócić i dobrać więcej gier.
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-steam-border bg-steam-dark/60 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-steam-border hover:bg-steam-navy text-steam-text hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Wróć do wyboru gier</span>
          </button>

          <button
            onClick={onProceed}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Kontynuuj mimo to</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
