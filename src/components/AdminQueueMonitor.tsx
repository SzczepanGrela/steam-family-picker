'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';
import { QueueStatus } from '@/lib/queue';

interface AdminQueueMonitorProps {
  status: QueueStatus | null;
  onRefresh?: () => void;
}

export default function AdminQueueMonitor({ status, onRefresh }: AdminQueueMonitorProps) {
  const [isActing, setIsActing] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  if (!status) return null;

  const percent = status.total > 0 ? Math.round((status.done / status.total) * 100) : 100;
  const hasRemaining = status.pending > 0 || status.processing > 0;
  const isRunning = status.isRunning && !status.isPaused;

  const handleAction = async (action: 'resume' | 'pause' | 'restart') => {
    setIsActing(true);
    try {
      await fetch('/api/admin/scan-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Queue action error:', err);
    } finally {
      setIsActing(false);
      setShowRestartConfirm(false);
    }
  };

  return (
    <div className="bg-steam-card border border-steam-border rounded-2xl p-5 shadow-lg space-y-4">
      {/* Restart Queue Confirm Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-steam-card border border-steam-border w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">Zrestartować kolejkę skanowania?</h3>
              </div>
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="text-steam-textMuted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-steam-textMuted leading-relaxed">
              Ta akcja zresetuje status wszystkich gier w kolejce i rozpocznie ich pełne skanowanie od zera zgodnie z limitem API Steam (50 req/min).
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRestartConfirm(false)}
                className="px-4 py-2 rounded-xl bg-steam-dark hover:bg-steam-navy border border-steam-border text-xs font-bold text-white transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => handleAction('restart')}
                disabled={isActing}
                className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isActing ? 'animate-spin' : ''}`} />
                <span>{isActing ? 'Restartowanie...' : 'Tak, zrestartuj'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${
            isRunning 
              ? 'bg-steam-blue/20 text-steam-blue animate-pulse' 
              : status.isPaused
              ? 'bg-yellow-500/20 text-steam-highlight'
              : 'bg-steam-green/20 text-steam-green'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <span>Monitor Kolejki API Steam (Family Share Scanner)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isRunning
                  ? 'bg-steam-blue/20 text-steam-blue border border-steam-blue/40'
                  : status.isPaused
                  ? 'bg-yellow-500/20 text-steam-highlight border border-yellow-500/40'
                  : 'bg-steam-green/20 text-steam-green border border-steam-green/40'
              }`}>
                {isRunning ? 'Przetwarzanie w toku' : status.isPaused ? 'Zatrzymana' : 'Kolejka ukończona'}
              </span>
            </h4>
            <p className="text-[11px] text-steam-textMuted mt-0.5">
              Bezpieczne tempo: 1 zapytanie co 1.2s (max 50 req/min, aby uniknąć limitów Steam Store).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {isRunning && (
            <button
              onClick={() => handleAction('pause')}
              disabled={isActing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-yellow-400 font-bold text-xs transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Wstrzymaj</span>
            </button>
          )}

          {status.isPaused && (
            <button
              onClick={() => handleAction('resume')}
              disabled={isActing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-steam-greenDark/40 hover:bg-steam-greenDark border border-steam-green text-steam-green font-bold text-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Wznów</span>
            </button>
          )}

          <button
            onClick={() => setShowRestartConfirm(true)}
            disabled={isActing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-steam-dark hover:bg-steam-navy border border-steam-border text-steam-textMuted hover:text-white font-bold text-xs transition-colors"
            title="Rozpocznij skanowanie wszystkich gier od nowa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Skanuj od nowa</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Numerical Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Postęp kolejki:</span>
            <span className="font-mono text-steam-blue">{status.done} / {status.total} gier</span>
            <span className="text-steam-textMuted">({percent}%)</span>
          </div>

          {hasRemaining && (
            <div className="flex items-center gap-1.5 text-steam-highlight font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Szacowany czas (ETA): ~
                {Math.ceil(status.estimatedTimeSeconds / 60) > 60
                  ? `${Math.floor(Math.ceil(status.estimatedTimeSeconds / 60) / 60)}h ${Math.ceil(status.estimatedTimeSeconds / 60) % 60}m`
                  : `${Math.ceil(status.estimatedTimeSeconds / 60)} min`}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-steam-dark overflow-hidden border border-steam-border/60 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isRunning ? 'bg-gradient-to-r from-steam-blue to-steam-highlight' : 'bg-steam-green'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Mini Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-steam-border/40 text-center text-xs">
        <div className="p-2 rounded-xl bg-steam-dark/60 border border-steam-border/40">
          <span className="text-[10px] text-steam-textMuted block">Oczekujące w kolejce</span>
          <span className="font-bold text-white font-mono">{status.pending}</span>
        </div>
        <div className="p-2 rounded-xl bg-steam-dark/60 border border-steam-border/40">
          <span className="text-[10px] text-steam-textMuted block">W trakcie skanowania</span>
          <span className="font-bold text-steam-blue font-mono">{status.processing}</span>
        </div>
        <div className="p-2 rounded-xl bg-steam-dark/60 border border-steam-border/40">
          <span className="text-[10px] text-steam-textMuted block">Zakończone pomyślnie</span>
          <span className="font-bold text-steam-green font-mono">{status.done}</span>
        </div>
        <div className="p-2 rounded-xl bg-steam-dark/60 border border-steam-border/40">
          <span className="text-[10px] text-steam-textMuted block">Niepowodzenia (Failed)</span>
          <span className={`font-bold font-mono ${status.failed > 0 ? 'text-steam-danger' : 'text-steam-textMuted'}`}>
            {status.failed}
          </span>
        </div>
      </div>
    </div>
  );
}
