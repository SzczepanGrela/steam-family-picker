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
  RefreshCw
} from 'lucide-react';
import { QueueStatus } from '@/lib/queue';

interface AdminQueueMonitorProps {
  status: QueueStatus | null;
  onRefresh?: () => void;
}

export default function AdminQueueMonitor({ status, onRefresh }: AdminQueueMonitorProps) {
  const [isActing, setIsActing] = useState(false);

  if (!status) return null;

  const percent = status.total > 0 ? Math.round((status.done / status.total) * 100) : 100;
  const hasRemaining = status.pending > 0 || status.processing > 0;
  const isRunning = status.isRunning && !status.isPaused;

  const handleAction = async (action: 'resume' | 'pause' | 'restart') => {
    if (action === 'restart') {
      if (!confirm('⚠️ Czy na pewno chcesz zresetować cały postęp i rozpocząć pełne skanowanie wszystkich gier od zera?')) {
        return;
      }
    }

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
    }
  };

  return (
    <div className="bg-steam-card border border-steam-border rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${
            isRunning 
              ? 'bg-steam-blue/20 text-steam-blue animate-pulse' 
              : status.isPaused
              ? 'bg-yellow-500/20 text-steam-highlight'
              : 'bg-steam-greenDark/30 text-steam-green'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Status Weryfikacji Family Sharing (Throttling)</h4>
            <p className="text-xs text-steam-textMuted">
              {isRunning
                ? 'Trwa bezpieczne pobieranie danych ze Steam Store API (1 zapytanie / 1.2s)'
                : status.isPaused
                ? 'Skanowanie wstrzymane przez administratora'
                : hasRemaining
                ? 'Oczekiwanie na wznowienie'
                : 'Wszystkie gry z bazy zostały zweryfikowane'}
            </p>
          </div>
        </div>

        {/* State Badge & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-steam-dark rounded-xl border border-steam-border">
            {isRunning ? (
              <button
                onClick={() => handleAction('pause')}
                disabled={isActing}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-steam-highlight border border-yellow-500/40 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                title="Wstrzymaj pracę kolejki"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Wstrzymaj</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction('resume')}
                disabled={isActing || !hasRemaining}
                className="flex items-center gap-1 px-3 py-1.5 bg-steam-blue hover:bg-steam-blueDark text-steam-dark text-xs font-bold rounded-lg transition-colors disabled:opacity-40"
                title="Wznów pracę kolejki"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Wznów</span>
              </button>
            )}

            <button
              onClick={() => handleAction('restart')}
              disabled={isActing}
              className="flex items-center gap-1 px-3 py-1.5 bg-steam-navy hover:bg-steam-danger/20 border border-steam-border hover:border-steam-danger/40 text-steam-textMuted hover:text-steam-danger text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              title="Wyczyść postęp i przeskanuj wszystkie gry od nowa"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isActing ? 'animate-spin' : ''}`} />
              <span>Skanuj od nowa</span>
            </button>
          </div>

          {/* Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isRunning 
              ? 'bg-blue-500/10 text-steam-blue border-blue-500/30' 
              : status.isPaused
              ? 'bg-yellow-500/10 text-steam-highlight border-yellow-500/30'
              : hasRemaining
              ? 'bg-steam-navy text-steam-textMuted border-steam-border'
              : 'bg-green-500/10 text-steam-green border-green-500/30'
          }`}>
            {isRunning ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Aktywne</span>
              </>
            ) : status.isPaused ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Wstrzymane</span>
              </>
            ) : hasRemaining ? (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Gotowe</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Zakończone</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-steam-text">
          <span>Przetworzono: <strong>{status.done}</strong> / <strong>{status.total}</strong> gier ({percent}%)</span>
          {hasRemaining && (
            <span className="text-steam-highlight">
              Szacowany czas (ETA): ~{Math.ceil(status.estimatedTimeSeconds / 60)} min ({status.estimatedTimeSeconds}s)
            </span>
          )}
        </div>

        <div className="w-full h-3 rounded-full bg-steam-dark overflow-hidden border border-steam-border/60 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-steam-blue to-steam-green transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-steam-textMuted pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-steam-green" /> Ukończone: {status.done}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full bg-steam-blue ${isRunning ? 'animate-ping' : ''}`} /> W kolejce: {status.pending + status.processing}
            </span>
            {status.failed > 0 && (
              <span className="flex items-center gap-1 text-steam-danger">
                <AlertTriangle className="w-3 h-3" /> Błędy: {status.failed}
              </span>
            )}
          </div>
          <span>Limit: max 50 req/min (bezpieczny dla API)</span>
        </div>
      </div>
    </div>
  );
}
