'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ClearSelectionConfirmModalProps {
  isOpen: boolean;
  selectedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  isClearing?: boolean;
}

export default function ClearSelectionConfirmModal({
  isOpen,
  selectedCount,
  onCancel,
  onConfirm,
  isClearing,
}: ClearSelectionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="relative w-full max-w-md bg-steam-card border-2 border-steam-danger/60 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-steam-border/40 pb-3">
          <div className="flex items-center gap-2.5 text-steam-danger">
            <div className="p-2 rounded-xl bg-steam-danger/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Wyczyść wszystkie wybory</h3>
              <p className="text-xs text-steam-textMuted">Liczba zaznaczonych gier: {selectedCount}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 text-steam-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-steam-danger/10 border border-steam-danger/30 text-xs text-steam-text leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-steam-danger flex-shrink-0 mt-0.5" />
          <p>
            Czy na pewno chcesz usunąć wszystkie swoje oznaczenia <strong className="text-steam-highlight">Must-Have</strong> i <strong className="text-steam-blue">Chętnie</strong>? Tej operacji nie można cofnąć.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-steam-border/40">
          <button
            onClick={onCancel}
            disabled={isClearing}
            className="px-4 py-2 rounded-xl border border-steam-border text-steam-text hover:text-white text-xs font-semibold"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={isClearing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-steam-danger hover:bg-red-600 text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Usuwanie...' : 'Tak, wyczyść wszystko'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
