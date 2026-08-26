'use client';

import React from 'react';
import { Check, BookmarkCheck, X, Layers, Gamepad2 } from 'lucide-react';
import { AccountWithMatches } from './AccountRankingBoard';
import { getAnonymousIdentity } from '@/lib/anonymous';

interface SubmitBallotConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  selectedGamesCount: number;
  accounts: AccountWithMatches[];
  isAlreadySubmitted?: boolean;
}

export default function SubmitBallotConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  isSubmitting,
  selectedGamesCount,
  accounts,
  isAlreadySubmitted,
}: SubmitBallotConfirmModalProps) {
  if (!isOpen) return null;

  const tier3Accounts = accounts.filter((a) => a.tier === 3);
  const tier2Accounts = accounts.filter((a) => a.tier === 2);
  const tier1Accounts = accounts.filter((a) => a.tier === 1);
  const tier0Accounts = accounts.filter((a) => a.tier === 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div className="relative w-full max-w-lg bg-steam-card border border-steam-highlight/50 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-steam-border/30 pb-3">
          <div className="flex items-center gap-2.5 text-steam-highlight">
            <div className="p-2 rounded-xl bg-steam-highlight/20">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isAlreadySubmitted ? 'Zaktualizuj swoje preferencje' : 'Zapisz swoje wybory'}
              </h3>
              <p className="text-xs text-steam-textMuted">Podsumowanie wybranych gier i bibliotek</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1 text-steam-textMuted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-steam-dark/80 border border-steam-border/50 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-white">
              <span className="flex items-center gap-1.5 text-steam-blue">
                <Gamepad2 className="w-4 h-4" />
                <span>Wskazane gry:</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-steam-blue/20 text-steam-blue font-black">
                {selectedGamesCount} gier
              </span>
            </div>

            <div className="flex items-center justify-between font-bold text-white pt-2 border-t border-steam-border/30">
              <span className="flex items-center gap-1.5 text-steam-highlight">
                <Layers className="w-4 h-4" />
                <span>Układ bibliotek:</span>
              </span>
              <span className="text-steam-textMuted">{accounts.length} bibliotek</span>
            </div>

            {/* Compact Breakdown */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-steam-highlight font-semibold">
                <span>🌟 Poziom 1 (Najwyższy priorytet):</span>
                <span>
                  {tier3Accounts.length > 0
                    ? tier3Accounts.map((a) => getAnonymousIdentity(a.steamId).name).join(', ')
                    : 'Brak'}
                </span>
              </div>
              <div className="flex items-center justify-between text-steam-blue font-medium">
                <span>👍 Poziom 2 (Wysoki priorytet):</span>
                <span>
                  {tier2Accounts.length > 0
                    ? tier2Accounts.map((a) => getAnonymousIdentity(a.steamId).name).join(', ')
                    : 'Brak'}
                </span>
              </div>
              <div className="flex items-center justify-between text-steam-green font-medium">
                <span>👌 Poziom 3 (Umiarkowany priorytet):</span>
                <span>
                  {tier1Accounts.length > 0
                    ? tier1Accounts.map((a) => getAnonymousIdentity(a.steamId).name).join(', ')
                    : 'Brak'}
                </span>
              </div>
              {tier0Accounts.length > 0 && (
                <div className="flex items-center justify-between text-steam-textMuted">
                  <span>➖ Poziom 4 (Pozostałe):</span>
                  <span>{tier0Accounts.length} bibliotek</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-steam-textMuted leading-relaxed text-[11px] px-1">
            Twoje preferencje zostaną zapisane i posłużą do stworzenia optymalnej grupy Steam Family. W każdej chwili możesz wrócić i zaktualizować swoje wybory.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-steam-border/30">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-steam-border text-steam-text hover:text-white text-xs font-semibold transition-colors"
          >
            Wróć do edycji
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Zapisywanie...' : 'Zapisz moje preferencje'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
