'use client';

import React from 'react';
import { Activity, Play, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { QueueStatus } from '@/lib/queue';

interface AdminQueueMonitorProps {
  status: QueueStatus | null;
  onRefresh?: () => void;
}

export default function AdminQueueMonitor({ status, onRefresh }: AdminQueueMonitorProps) {
  if (!status) return null;

  const percent = status.total > 0 ? Math.round((status.done / status.total) * 100) : 100;
  const isScanning = status.pending > 0 || status.processing > 0;

  const handleStartWorker = async () => {
    await fetch('/api/admin/scan-queue', { method: 'POST' });
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-steam-card border border-steam-border rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${isScanning ? 'bg-steam-blue/20 text-steam-blue animate-pulse' : 'bg-steam-greenDark/30 text-steam-green'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Status Weryfikacji Family Sharing (Throttling)</h4>
            <p className="text-xs text-steam-textMuted">
              {isScanning ? 'Trwa bezpieczne pobieranie danych ze Steam Store API (1 zapytanie / 1.2s)' : 'Wszystkie gry z bazy zostały przeskanowane'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isScanning && !status.isRunning && (
            <button
              onClick={handleStartWorker}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-steam-blue hover:bg-steam-blueDark text-steam-dark text-xs font-bold rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Wznów skanowanie</span>
            </button>
          )}

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isScanning 
              ? 'bg-blue-500/10 text-steam-blue border-blue-500/30' 
              : 'bg-green-500/10 text-steam-green border-green-500/30'
          }`}>
            {isScanning ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>{isScanning ? 'W toku' : 'Zakończone'}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-steam-text">
          <span>Przetworzono: <strong>{status.done}</strong> / <strong>{status.total}</strong> gier ({percent}%)</span>
          {isScanning && (
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

        <div className="flex items-center justify-between text-[11px] text-steam-textMuted pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-steam-green" /> Ukończone: {status.done}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-steam-blue animate-ping" /> W kolejce: {status.pending + status.processing}
            </span>
            {status.failed > 0 && (
              <span className="flex items-center gap-1 text-steam-danger">
                <AlertTriangle className="w-3 h-3" /> Błędy: {status.failed}
              </span>
            )}
          </div>
          <span>Limit: max 50 req/min (ochrona przed blokadą IP)</span>
        </div>
      </div>
    </div>
  );
}
