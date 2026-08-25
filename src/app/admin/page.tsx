'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Shield, 
  Lock, 
  Users, 
  Gamepad2, 
  Activity, 
  Trash2, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Vote, 
  Trophy, 
  LogOut, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import AdminQueueMonitor from '@/components/AdminQueueMonitor';
import { QueueStatus } from '@/lib/queue';
import { PhaseType } from '@/lib/db';

interface AccountRow {
  steam_id: string;
  persona_name: string;
  avatar_url: string;
  profile_url: string;
  is_public: number;
  total_games: number;
  shareable_games: number;
  scan_status: string;
  created_at: string;
  last_scanned_at: string;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Admin Dashboard State
  const [phase, setPhase] = useState<PhaseType>('registration');
  const [stats, setStats] = useState({
    totalAccounts: 0,
    uniqueShareableGames: 0,
    totalRegisteredGames: 0,
    totalVoters: 0,
  });
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  // Manual Add input
  const [manualInput, setManualInput] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch admin dashboard state
  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/state');
      if (res.status === 401) {
        setIsAdmin(false);
        return;
      }
      const data = await res.json();
      setIsAdmin(true);
      setPhase(data.phase);
      setStats(data.stats);
      setAccounts(data.accounts || []);
      setQueueStatus(data.queueStatus || null);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Polling queue status every 3 seconds if items are in queue
  useEffect(() => {
    if (isAdmin && queueStatus && (queueStatus.pending > 0 || queueStatus.processing > 0)) {
      const interval = setInterval(async () => {
        const res = await fetch('/api/admin/scan-queue');
        const qData = await res.json();
        setQueueStatus(qData);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, queueStatus]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdmin(true);
        fetchAdminData();
      } else {
        setLoginError(data.error || 'Nieprawidłowe hasło');
      }
    } catch {
      setLoginError('Błąd połączenia z serwerem');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAdmin(false);
    setPassword('');
  };

  // Handle Phase Change
  const handlePhaseChange = async (newPhase: PhaseType) => {
    if (!confirm(`Czy na pewno chcesz zmienić etap projektu na: ${newPhase.toUpperCase()}?`)) return;

    try {
      const res = await fetch('/api/admin/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: newPhase }),
      });
      if (res.ok) {
        setPhase(newPhase);
      }
    } catch (err) {
      console.error('Error changing phase:', err);
    }
  };

  // Handle Manual Account Addition
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput) return;
    setIsAddingAccount(true);
    setAddMessage(null);

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: manualInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddMessage({ type: 'success', text: `Pomyślnie dodano konto: ${data.account.persona_name} (${data.account.total_games} gier)` });
        setManualInput('');
        fetchAdminData();
      } else {
        setAddMessage({ type: 'error', text: data.error || 'Błąd dodawania konta' });
      }
    } catch {
      setAddMessage({ type: 'error', text: 'Błąd połączenia z serwerem' });
    } finally {
      setIsAddingAccount(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async (steamId: string, name: string) => {
    if (!confirm(`Czy na pewno usunąć konto ${name} (${steamId}) z puli?`)) return;

    try {
      const res = await fetch(`/api/admin/accounts?steamId=${steamId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-steam-blue">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Sprawdzanie uprawnień...</p>
        </div>
      </div>
    );
  }

  // Password Login Screen
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-steam-card border border-steam-border p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-steam-highlight/20 text-steam-highlight flex items-center justify-center mx-auto shadow-glow-accent">
          <Shield className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-white">Panel Administratora</h2>
          <p className="text-xs text-steam-textMuted">Wprowadź hasło dostępu, aby zarządzać projektem.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Hasło administratora"
              className="w-full px-4 py-3 bg-steam-dark border border-steam-border rounded-xl text-sm text-white focus:outline-none focus:border-steam-highlight focus:ring-1 focus:ring-steam-highlight"
              autoFocus
            />
            {loginError && (
              <p className="text-xs text-steam-danger mt-1.5 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {loginError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-steam-highlight hover:bg-yellow-400 text-steam-dark font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Zaloguj do Panelu</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-steam-card border border-steam-border p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-steam-highlight/20 text-steam-highlight">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Panel Sterowania Administratora</h2>
            <p className="text-xs text-steam-textMuted">Zarządzanie fazami, kolejką throttlingu oraz pulą kont</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-steam-navy hover:bg-steam-dark border border-steam-border text-xs font-semibold text-steam-textMuted hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Wyloguj</span>
        </button>
      </div>

      {/* Phase Control Buttons */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">Sterowanie Fazami Projektu</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase 1 Button */}
          <button
            onClick={() => handlePhaseChange('registration')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              phase === 'registration'
                ? 'bg-steam-blue/20 border-steam-blue shadow-glow-blue'
                : 'bg-steam-dark/60 border-steam-border hover:border-steam-borderHover opacity-70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white">1. Zgłaszanie Kont</span>
              {phase === 'registration' && <span className="w-2.5 h-2.5 rounded-full bg-steam-blue animate-ping" />}
            </div>
            <p className="text-xs text-steam-textMuted">
              Gracze mogą zgłaszać swoje profile przez Steam. Głosowanie jest zablokowane.
            </p>
          </button>

          {/* Phase 2 Button */}
          <button
            onClick={() => handlePhaseChange('voting')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              phase === 'voting'
                ? 'bg-steam-highlight/20 border-steam-highlight shadow-[0_0_15px_-3px_rgba(255,200,44,0.4)]'
                : 'bg-steam-dark/60 border-steam-border hover:border-steam-borderHover opacity-70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white">2. Głosowanie na Gry</span>
              {phase === 'voting' && <span className="w-2.5 h-2.5 rounded-full bg-steam-highlight animate-ping" />}
            </div>
            <p className="text-xs text-steam-textMuted">
              Zgłoszenia zamknięte. Gracze wybierają preferencje gier z połączonego katalogu.
            </p>
          </button>

          {/* Phase 3 Button */}
          <button
            onClick={() => handlePhaseChange('completed')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              phase === 'completed'
                ? 'bg-steam-green/20 border-steam-green shadow-glow-green'
                : 'bg-steam-dark/60 border-steam-border hover:border-steam-borderHover opacity-70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white">3. Publikacja Wyników</span>
              {phase === 'completed' && <span className="w-2.5 h-2.5 rounded-full bg-steam-green" />}
            </div>
            <p className="text-xs text-steam-textMuted">
              Głosowanie zamknięte. Na stronie głównej pojawia się zwycięska czwórka kont i statystyki.
            </p>
          </button>
        </div>
      </div>

      {/* Throttling & Queue Monitor */}
      <AdminQueueMonitor status={queueStatus} onRefresh={fetchAdminData} />

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-border/60 text-center">
          <div className="text-2xl font-black text-white">{stats.totalAccounts}</div>
          <div className="text-[11px] text-steam-textMuted mt-0.5">Zgłoszonych kont</div>
        </div>
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-green/30 text-center">
          <div className="text-2xl font-black text-steam-green">{stats.uniqueShareableGames}</div>
          <div className="text-[11px] text-steam-green/80 mt-0.5">Unikalnych gier Family Share</div>
        </div>
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-border/60 text-center">
          <div className="text-2xl font-black text-white">{stats.totalRegisteredGames}</div>
          <div className="text-[11px] text-steam-textMuted mt-0.5">Wszystkich gier w bazie</div>
        </div>
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-highlight/30 text-center">
          <div className="text-2xl font-black text-steam-highlight">{stats.totalVoters}</div>
          <div className="text-[11px] text-steam-highlight/80 mt-0.5">Głosujących osób</div>
        </div>
      </div>

      {/* Manual Account Adder */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">Ręczne Dodawanie Konta (SteamID / Vanity Link)</h3>
        <form onSubmit={handleAddAccount} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Wklej SteamID64, link do profilu lub custom url (np. 76561198000000000 lub https://steamcommunity.com/id/nick)"
            className="flex-1 px-4 py-2.5 bg-steam-dark border border-steam-border rounded-xl text-xs text-white placeholder-steam-textMuted focus:outline-none focus:border-steam-blue"
          />
          <button
            type="submit"
            disabled={isAddingAccount || !manualInput}
            className="px-5 py-2.5 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingAccount ? 'Pobieranie...' : 'Dodaj konto'}</span>
          </button>
        </form>

        {addMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              addMessage.type === 'success'
                ? 'bg-steam-greenDark/20 border border-steam-greenDark/40 text-steam-green'
                : 'bg-steam-danger/10 border border-steam-danger/40 text-steam-danger'
            }`}
          >
            {addMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{addMessage.text}</span>
          </div>
        )}
      </div>

      {/* Accounts List Table */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Konta w Puli ({accounts.length})</h3>
          <button
            onClick={fetchAdminData}
            className="p-2 rounded-lg bg-steam-navy hover:bg-steam-dark text-steam-textMuted hover:text-white transition-colors"
            title="Odśwież dane"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8 text-xs text-steam-textMuted">
            Brak kont w puli. Gracze mogą dołączyć logując się przez stronę główną lub możesz dodać ich ręcznie powyżej.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-steam-textMuted uppercase border-b border-steam-border/60 text-[10px]">
                <tr>
                  <th className="py-3 px-3">Użytkownik</th>
                  <th className="py-3 px-3">SteamID</th>
                  <th className="py-3 px-3 text-center">Profil</th>
                  <th className="py-3 px-3 text-center">Gry Ogółem</th>
                  <th className="py-3 px-3 text-center">Family Share</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steam-border/40">
                {accounts.map((acc) => (
                  <tr key={acc.steam_id} className="hover:bg-steam-navy/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-steam-border flex-shrink-0">
                          <Image
                            src={acc.avatar_url || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                            alt={acc.persona_name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="font-bold text-white truncate max-w-[150px]">{acc.persona_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-steam-textMuted">{acc.steam_id}</td>
                    <td className="py-3 px-3 text-center">
                      {acc.is_public ? (
                        <span className="px-2 py-0.5 rounded-full bg-steam-green/20 text-steam-green font-medium text-[10px]">
                          Publiczny
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-steam-danger/20 text-steam-danger font-medium text-[10px]">
                          Prywatny
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-white">{acc.total_games}</td>
                    <td className="py-3 px-3 text-center font-bold text-steam-green">{acc.shareable_games}</td>
                    <td className="py-3 px-3 text-center">
                      {acc.scan_status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-steam-navy text-steam-textMuted text-[10px]">
                          Zakończono
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-steam-blue/20 text-steam-blue text-[10px] animate-pulse">
                          Skanowanie...
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={acc.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-steam-textMuted hover:text-white hover:bg-steam-dark transition-colors"
                          title="Otwórz profil Steam"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteAccount(acc.steam_id, acc.persona_name)}
                          className="p-1.5 rounded-lg text-steam-textMuted hover:text-steam-danger hover:bg-steam-danger/10 transition-colors"
                          title="Usuń konto z puli"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
