'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Shield, 
  Lock, 
  Trash2, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  LogOut, 
  ExternalLink,
  AlertTriangle,
  HelpCircle,
  Eye,
  Vote,
  X
} from 'lucide-react';
import AdminQueueMonitor from '@/components/AdminQueueMonitor';
import PrivacyHelpModal from '@/components/PrivacyHelpModal';
import AccountLibraryModal from '@/components/AccountLibraryModal';
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
  has_voted?: number;
  created_at: string;
  last_scanned_at: string;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [inspectSteamId, setInspectSteamId] = useState<string | null>(null);
  const [inspectName, setInspectName] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<{ steamId: string; name: string } | null>(null);

  // Admin Dashboard State
  const [phase, setPhase] = useState<PhaseType>('registration');
  const [stats, setStats] = useState({
    totalAccounts: 0,
    uniqueShareableGames: 0,
    totalRegisteredGames: 0,
    totalShareableValueFormatted: '0,00 zł',
    totalVoters: 0,
  });
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  // Manual Add input
  const [manualInput, setManualInput] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Check auth
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/state');
      if (res.ok) {
        setIsAdmin(true);
        const data = await res.json();
        setPhase(data.phase);
        setStats(data.stats);
        setAccounts(data.accounts);
        setQueueStatus(data.queueStatus);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch full state periodically
  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/state');
      if (res.ok) {
        const data = await res.json();
        setPhase(data.phase);
        setStats(data.stats);
        setAccounts(data.accounts);
        setQueueStatus(data.queueStatus);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }, []);

  // Poll state when queue is busy
  useEffect(() => {
    if (isAdmin && queueStatus && (queueStatus.pending > 0 || queueStatus.processing > 0)) {
      let isMounted = true;
      let isFetching = false;
      const interval = setInterval(async () => {
        if (isFetching) return;
        isFetching = true;
        try {
          if (isMounted) await fetchAdminData();
        } catch (err) {
          console.error('Queue poll error:', err);
        } finally {
          isFetching = false;
        }
      }, 3000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [isAdmin, queueStatus, fetchAdminData]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAdmin(true);
        setPassword('');
        fetchAdminData();
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Nieprawidłowe hasło');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Błąd połączenia');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAdmin(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Phase switch
  const handleSetPhase = async (newPhase: PhaseType) => {
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

  // Manual Add Account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setIsAddingAccount(true);
    setAddMessage(null);

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: manualInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (!data.isPublic || data.totalGames === 0) {
          setAddMessage({
            type: 'warning',
            text: `⚠️ Dodano konto: ${data.account.personaName}, ale jego biblioteka jest PRYWATNA (0 pobranych gier). Poproś gracza o ustawienie „Szczegóły gry: Publiczne” na Steam, a następnie kliknij „Sprawdź”.`,
          });
        } else {
          setAddMessage({
            type: 'success',
            text: `Pomyślnie dodano konto: ${data.account.personaName} (${data.totalGames} pobranych gier)`,
          });
        }
        setManualInput('');
        fetchAdminData();
      } else {
        setAddMessage({
          type: 'error',
          text: data.error || 'Nie udało się dodać konta',
        });
      }
    } catch (err) {
      console.error('Error adding account:', err);
      setAddMessage({ type: 'error', text: 'Wystąpił błąd podczas dodawania' });
    } finally {
      setIsAddingAccount(false);
    }
  };

  // Re-check single account status
  const handleRecheckAccount = async (steamId: string, name: string) => {
    setRecheckingId(steamId);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (!data.isPublic || data.totalGames === 0) {
          setAddMessage({
            type: 'warning',
            text: `Konto ${name} nadal ma prywatną bibliotekę na Steam (0 gier).`,
          });
        } else {
          setAddMessage({
            type: 'success',
            text: `Odblokowano! Konto ${name} udostępniło ${data.totalGames} gier (dodano do kolejki skanowania).`,
          });
        }
        fetchAdminData();
      } else {
        alert(data.error || 'Błąd ponownego sprawdzania konta');
      }
    } catch (err) {
      console.error('Error rechecking account:', err);
    } finally {
      setRecheckingId(null);
    }
  };

  // Confirm Delete Account execution
  const confirmDeleteAccount = async (steamId: string) => {
    try {
      const res = await fetch(`/api/admin/accounts?steamId=${steamId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
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
              placeholder="Hasło administratora..."
              className="w-full px-4 py-3 bg-steam-dark border border-steam-border rounded-xl text-xs text-white placeholder-steam-textMuted focus:outline-none focus:border-steam-blue"
              autoFocus
            />
            {loginError && <p className="text-xs text-steam-danger mt-1.5">{loginError}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Zaloguj do Panelu</span>
          </button>
        </form>
      </div>
    );
  }

  const privateAccounts = accounts.filter((a) => a.is_public === 0 || a.total_games === 0);

  return (
    <div className="space-y-6 pb-12">
      <PrivacyHelpModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <AccountLibraryModal
        steamId={inspectSteamId}
        accountName={inspectName}
        onClose={() => setInspectSteamId(null)}
      />

      {/* Delete Confirmation Modal (Requirement 4.1) */}
      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-steam-card border-2 border-steam-danger/60 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-steam-border/40 pb-3">
              <div className="flex items-center gap-2.5 text-steam-danger">
                <div className="p-2 rounded-xl bg-steam-danger/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Potwierdź usunięcie konta</h3>
                  <p className="text-xs text-steam-textMuted">{deleteTarget.name} ({deleteTarget.steamId})</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1 text-steam-textMuted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-steam-text leading-relaxed">
              Czy na pewno chcesz usunąć to konto z puli? Spowoduje to bezpowrotne usunięcie wszystkich jego powiązanych gier z bazy oraz ewentualnie oddanych przez to konto głosów.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-steam-border/40">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-steam-border text-steam-text hover:text-white text-xs font-semibold"
              >
                Anuluj
              </button>
              <button
                onClick={() => confirmDeleteAccount(deleteTarget.steamId)}
                className="px-4 py-2 rounded-xl bg-steam-danger hover:bg-red-600 text-white text-xs font-black shadow-md transition-all active:scale-95"
              >
                Usuń konto bezpowrotnie
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Private Profiles Warning Alert Banner */}
      {privateAccounts.length > 0 && (
        <div className="bg-steam-danger/10 border-2 border-steam-danger/50 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 text-steam-danger">
              <div className="p-2 rounded-xl bg-steam-danger/20 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-steam-danger" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Wykryto prywatne biblioteki Steam ({privateAccounts.length})
                </h3>
                <p className="text-xs text-steam-textMuted mt-0.5">
                  Poniższe konta mają ukryte szczegóły gier w ustawieniach prywatności Steam. System nie może pobrać z nich gier.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-steam-navy hover:bg-steam-dark border border-steam-border text-white text-xs font-semibold rounded-xl transition-colors self-end sm:self-center flex-shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5 text-steam-blue" />
              <span>Instrukcja dla graczy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-steam-danger/30">
            {privateAccounts.map((acc) => (
              <div
                key={acc.steam_id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-steam-dark/90 border border-steam-danger/40"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-steam-danger flex-shrink-0">
                    <Image
                      src={acc.avatar_url || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                      alt={acc.persona_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="font-bold text-white text-xs truncate">{acc.persona_name}</span>
                </div>

                <button
                  onClick={() => handleRecheckAccount(acc.steam_id, acc.persona_name)}
                  disabled={recheckingId === acc.steam_id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-steam-danger hover:bg-red-600 text-white text-[11px] font-bold transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${recheckingId === acc.steam_id ? 'animate-spin' : ''}`} />
                  <span>Sprawdź</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase Switcher Card */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Zarządzanie Fazą Projektu</h3>
          <span className="text-xs text-steam-textMuted">
            Aktualna faza:{' '}
            <strong className="text-steam-blue uppercase">
              {phase === 'registration' ? '1. Zgłaszanie' : phase === 'voting' ? '2. Głosowanie' : '3. Wyniki'}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSetPhase('registration')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              phase === 'registration'
                ? 'bg-steam-blue/20 border-steam-blue text-white shadow-glow-blue'
                : 'bg-steam-dark/60 border-steam-border text-steam-textMuted hover:text-white'
            }`}
          >
            <div className="font-bold text-sm">Faza 1: Zgłaszanie Kont</div>
            <p className="text-[11px] mt-1 opacity-80">Gracze dodają konta Steam i weryfikowany jest Family Share</p>
          </button>

          <button
            onClick={() => handleSetPhase('voting')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              phase === 'voting'
                ? 'bg-steam-highlight/20 border-steam-highlight text-white shadow-glow-accent'
                : 'bg-steam-dark/60 border-steam-border text-steam-textMuted hover:text-white'
            }`}
          >
            <div className="font-bold text-sm">Faza 2: Głosowanie</div>
            <p className="text-[11px] mt-1 opacity-80">Zgłoszenia zablokowane. Gracze wybierają gry i układają hierarchię kont</p>
          </button>

          <button
            onClick={() => handleSetPhase('completed')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              phase === 'completed'
                ? 'bg-steam-green/20 border-steam-green text-white shadow-glow-green'
                : 'bg-steam-dark/60 border-steam-border text-steam-textMuted hover:text-white'
            }`}
          >
            <div className="font-bold text-sm">Faza 3: Wyniki TOP 10</div>
            <p className="text-[11px] mt-1 opacity-80">Głosowanie zamknięte. Prezentacja oficjalnego rankingu TOP 10</p>
          </button>
        </div>
      </div>

      {/* Queue Throttling Worker Monitor */}
      <AdminQueueMonitor
        status={queueStatus}
        onRefresh={fetchAdminData}
      />

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-border/60 text-center">
          <div className="text-2xl font-black text-white">{stats.totalAccounts}</div>
          <div className="text-[11px] text-steam-textMuted mt-0.5">Zgłoszonych kont</div>
        </div>
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-green/30 text-center">
          <div className="text-2xl font-black text-steam-green">{stats.uniqueShareableGames}</div>
          <div className="text-[11px] text-steam-green/80 mt-0.5">Gier Family Share</div>
        </div>
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-blue/30 text-center">
          <div className="text-sm sm:text-base font-black text-steam-blue truncate mt-1">
            {stats.totalShareableValueFormatted || '0,00 zł'}
          </div>
          <div className="text-[11px] text-steam-textMuted mt-0.5">Wartość Share</div>
        </div>
        <div className="bg-steam-card p-4 rounded-2xl border border-steam-border/60 text-center">
          <div className="text-2xl font-black text-white">{stats.totalRegisteredGames}</div>
          <div className="text-[11px] text-steam-textMuted mt-0.5">Wszystkich gier</div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-steam-card p-4 rounded-2xl border border-steam-highlight/30 text-center">
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
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              addMessage.type === 'success'
                ? 'bg-steam-greenDark/20 border border-steam-greenDark/40 text-steam-green'
                : addMessage.type === 'warning'
                ? 'bg-yellow-500/10 border border-yellow-500/40 text-steam-highlight'
                : 'bg-steam-danger/10 border border-steam-danger/40 text-steam-danger'
            }`}
          >
            {addMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {addMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{addMessage.text}</span>
          </div>
        )}
      </div>

      {/* Accounts List Table */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Zgłoszone Konta ({accounts.length})</h3>
          <button
            onClick={fetchAdminData}
            className="p-1.5 rounded-xl bg-steam-dark border border-steam-border text-steam-textMuted hover:text-white transition-colors"
            title="Odśwież listę"
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
                  <th className="py-3 px-3 text-center">Głosowanie</th>
                  <th className="py-3 px-3 text-center">Gry Ogółem</th>
                  <th className="py-3 px-3 text-center">Family Share</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steam-border/40">
                {accounts.map((acc) => {
                  const isPrivate = acc.is_public === 0 || acc.total_games === 0;
                  return (
                    <tr key={acc.steam_id} className={`transition-colors ${isPrivate ? 'bg-steam-danger/5 hover:bg-steam-danger/10' : 'hover:bg-steam-navy/40'}`}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`relative w-8 h-8 rounded-full overflow-hidden border flex-shrink-0 ${isPrivate ? 'border-steam-danger' : 'border-steam-border'}`}>
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
                        {!isPrivate ? (
                          <span className="px-2 py-0.5 rounded-full bg-steam-green/20 text-steam-green font-medium text-[10px]">
                            Publiczny
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-steam-danger/20 text-steam-danger font-medium text-[10px] flex items-center justify-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Prywatny
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {acc.has_voted === 1 ? (
                          <span className="px-2 py-0.5 rounded-full bg-steam-green/20 text-steam-green font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Zagłosował</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-steam-dark text-steam-textMuted font-medium text-[10px] border border-steam-border/40">
                            Brak głosu
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-white">{acc.total_games}</td>
                      <td className="py-3 px-3 text-center font-bold text-steam-green">{acc.shareable_games}</td>
                      <td className="py-3 px-3 text-center">
                        {isPrivate ? (
                          <span className="px-2 py-0.5 rounded-full bg-steam-danger/20 text-steam-danger text-[10px]">
                            Brak dostępu
                          </span>
                        ) : acc.scan_status === 'completed' ? (
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
                          {isPrivate && (
                            <button
                              onClick={() => handleRecheckAccount(acc.steam_id, acc.persona_name)}
                              disabled={recheckingId === acc.steam_id}
                              className="flex items-center gap-1 p-1.5 px-2 rounded-lg bg-steam-danger/20 hover:bg-steam-danger text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                              title="Sprawdź ponownie dostęp do gier"
                            >
                              <RefreshCw className={`w-3 h-3 ${recheckingId === acc.steam_id ? 'animate-spin' : ''}`} />
                              <span>Sprawdź</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setInspectSteamId(acc.steam_id);
                              setInspectName(acc.persona_name);
                            }}
                            className="p-1.5 rounded-lg text-steam-blue hover:text-white hover:bg-steam-blue/20 transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="Przeglądaj pełną bibliotekę gier tego konta"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Gry ({acc.total_games})</span>
                          </button>
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
                            onClick={() => setDeleteTarget({ steamId: acc.steam_id, name: acc.persona_name })}
                            className="p-1.5 rounded-lg text-steam-textMuted hover:text-steam-danger hover:bg-steam-danger/10 transition-colors"
                            title="Usuń konto z puli"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
