'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  UserPlus, 
  RefreshCw, 
  ShieldAlert, 
  Gamepad2, 
  Lock, 
  Check, 
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import PrivacyHelpModal from '@/components/PrivacyHelpModal';

interface MyGamesData {
  isSubmitted: boolean;
  account?: {
    steam_id: string;
    persona_name: string;
    avatar_url: string;
    profile_url: string;
    isPublic: boolean;
    total_games: number;
    shareable_games: number;
    scan_status: string;
    last_scanned_at: string;
  };
  stats?: {
    total: number;
    shareable: number;
    excluded: number;
    pending: number;
    totalShareableValueCents?: number;
    totalShareableValueFormatted?: string;
  };
  games?: Array<{
    appId: number;
    name: string;
    headerImage: string;
    isFamilyShareable: boolean | null;
    genres: string[];
    playtimeForever: number;
    queueStatus: string;
  }>;
}

export default function SubmitPage() {
  const [user, setUser] = useState<{ steamId: string; personaName: string; avatarUrl: string } | null>(null);
  const [phase, setPhase] = useState<string>('registration');
  const [data, setData] = useState<MyGamesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [gameTab, setGameTab] = useState<'shareable' | 'excluded' | 'all'>('shareable');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      setUser(meData.user);
      setPhase(meData.phase);

      if (meData.user) {
        const gamesRes = await fetch('/api/my-games');
        const gamesData = await gamesRes.json();
        setData(gamesData);
      }
    } catch (err) {
      console.error('Error fetching submit page data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling if scanning
  useEffect(() => {
    if (data?.account?.scan_status === 'scanning' || (data?.stats && data.stats.pending > 0)) {
      let isMounted = true;
      let isFetching = false;
      const interval = setInterval(async () => {
        if (isFetching) return;
        isFetching = true;
        try {
          if (isMounted) await fetchData();
        } finally {
          isFetching = false;
        }
      }, 3000);
      return () => { isMounted = false; clearInterval(interval); };
    }
  }, [data, fetchData]);

  const handleSubmitAccount = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error || 'Błąd podczas zgłaszania konta');
      }
    } catch (err) {
      console.error('Error submitting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-steam-blue" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-steam-card border border-steam-border p-6 rounded-2xl shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-xl bg-steam-blue/20 text-steam-blue flex items-center justify-center mx-auto">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Zgłoś konto Steam</h2>
          <p className="text-xs text-steam-textMuted mt-1">
            Zaloguj się przez Steam, aby dodać bibliotekę do puli.
          </p>
        </div>
        <a
          href="/api/auth/steam?returnTo=/submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs transition-colors"
        >
          <span>Zaloguj przez Steam</span>
        </a>
      </div>
    );
  }

  const isSubmitted = data?.isSubmitted;
  const isScanning = data?.account?.scan_status === 'scanning' || (data?.stats && data.stats.pending > 0);
  const isPrivate = data?.account && !data.account.isPublic;

  const games = data?.games || [];
  const filteredGames = games.filter((g) => {
    if (searchQuery && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (gameTab === 'shareable') return g.isFamilyShareable === true;
    if (gameTab === 'excluded') return g.isFamilyShareable === false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PrivacyHelpModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      {/* Account Card */}
      <div className="bg-steam-card border border-steam-border rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-steam-blue flex-shrink-0">
            <Image
              src={user.avatarUrl}
              alt={user.personaName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg font-bold text-white">{user.personaName}</h2>
              {isSubmitted && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-steam-green/20 text-steam-green border border-steam-green/40">
                  W puli
                </span>
              )}
            </div>
            <span className="text-[11px] text-steam-textMuted font-mono">{user.steamId}</span>
          </div>
        </div>

        <div>
          {phase !== 'registration' && !isSubmitted ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-steam-dark text-steam-textMuted text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Zgłoszenia zamknięte</span>
            </div>
          ) : !isSubmitted ? (
            <button
              onClick={handleSubmitAccount}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-steam-blue hover:bg-steam-blueDark text-steam-dark font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Zgłaszanie...' : 'Zgłoś konto do puli'}</span>
            </button>
          ) : (
            <button
              onClick={handleSubmitAccount}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-steam-text hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Odśwież gry ze Steam</span>
            </button>
          )}
        </div>
      </div>

      {/* Private Profile Alert */}
      {isSubmitted && isPrivate && (
        <div className="bg-steam-danger/10 border border-steam-danger/40 rounded-xl p-4 space-y-2.5">
          <div className="flex items-start gap-2.5 text-steam-danger">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-sm">Biblioteka Steam jest prywatna</h3>
              <p className="text-xs text-steam-textMuted mt-0.5">
                Ustaw "Szczegóły gry" na Publiczne w Steam, aby gry mogły zostać pobrane.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-steam-danger hover:bg-red-600 text-white font-bold text-xs rounded-lg transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Instrukcja</span>
            </button>
            <button
              onClick={handleSubmitAccount}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 bg-steam-navy hover:bg-steam-card border border-steam-border text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Sprawdź ponownie</span>
            </button>
          </div>
        </div>
      )}

      {/* Scan Progress Bar & Stats */}
      {isSubmitted && data?.stats && !isPrivate && (
        <div className="space-y-4">
          {/* Progress Bar if scanning */}
          {isScanning && (
            <div className="bg-steam-card border border-steam-blue/40 rounded-2xl p-4 space-y-2 shadow-lg animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1.5 text-steam-blue font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Weryfikacja Family Sharing przez API Steam...</span>
                </div>
                <div className="flex items-center gap-2 text-steam-textMuted font-mono">
                  <span>
                    {data.stats.total - data.stats.pending} / {data.stats.total} gier
                  </span>
                  {data.stats.pending > 0 && (
                    <span className="text-steam-highlight font-sans text-[11px]">
                      (ETA: ~{Math.ceil((data.stats.pending * 1.2) / 60)} min)
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-steam-dark overflow-hidden p-0.5 border border-steam-border/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-steam-blue to-steam-green transition-all duration-500"
                  style={{
                    width: `${Math.round(((data.stats.total - data.stats.pending) / (data.stats.total || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Completed State Next Step Banner */}
          {!isScanning && data.stats.pending === 0 && (
            <div className="p-4 rounded-2xl bg-steam-greenDark/15 border border-steam-greenDark/40 text-xs text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-steam-green/20 text-steam-green flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-sm">Biblioteka w pełni przeskanowana i gotowa!</span>
                  <span className="text-steam-textMuted text-[11px]">
                    Twoje gry biorą udział w doborze. Gdy admin uruchomi głosowanie, przejdziesz do wyboru gier i układania rankingu.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats Badges & Value */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-steam-card p-3 rounded-xl border border-steam-border/60 text-center">
              <div className="text-lg font-bold text-white">{data.stats.total}</div>
              <div className="text-[10px] text-steam-textMuted">Wszystkie gry</div>
            </div>
            <div className="bg-steam-card p-3 rounded-xl border border-steam-green/30 text-center">
              <div className="text-lg font-bold text-steam-green">{data.stats.shareable}</div>
              <div className="text-[10px] text-steam-green">Współdzielone</div>
            </div>
            <div className="bg-steam-card p-3 rounded-xl border border-steam-danger/30 text-center">
              <div className="text-lg font-bold text-steam-danger">{data.stats.excluded}</div>
              <div className="text-[10px] text-steam-danger">Wykluczone</div>
            </div>
            <div className="bg-steam-card p-3 rounded-xl border border-steam-border/60 text-center">
              <div className="text-lg font-bold text-steam-highlight">{data.stats.pending}</div>
              <div className="text-[10px] text-steam-highlight">Oczekujące</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-steam-navy/80 p-3 rounded-xl border border-steam-blue/30 text-center">
              <div className="text-sm font-black text-steam-blue truncate">
                {data.stats.totalShareableValueFormatted || '0,00 zł'}
              </div>
              <div className="text-[10px] text-steam-textMuted">Wartość Share</div>
            </div>
          </div>

          {/* Games list preview */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                <Gamepad2 className="w-4 h-4 text-steam-blue" />
                <span>Gry z Twojego konta</span>
              </div>

              {/* Tabs + Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Szukaj w swoich grach..."
                    className="w-full sm:w-48 px-3 py-1.5 bg-steam-dark border border-steam-border rounded-lg text-xs text-white placeholder-steam-textMuted focus:outline-none focus:border-steam-blue"
                  />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-steam-dark rounded-lg border border-steam-border text-xs font-medium">
                  <button
                    onClick={() => setGameTab('shareable')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      gameTab === 'shareable' ? 'bg-steam-green text-steam-dark font-bold' : 'text-steam-textMuted hover:text-white'
                    }`}
                  >
                    Współdzielone ({data.stats.shareable})
                  </button>
                  <button
                    onClick={() => setGameTab('excluded')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      gameTab === 'excluded' ? 'bg-steam-danger text-white font-bold' : 'text-steam-textMuted hover:text-white'
                    }`}
                  >
                    Wykluczone ({data.stats.excluded})
                  </button>
                  <button
                    onClick={() => setGameTab('all')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      gameTab === 'all' ? 'bg-steam-card text-white font-bold' : 'text-steam-textMuted hover:text-white'
                    }`}
                  >
                    Wszystkie ({data.stats.total})
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredGames.map((g) => (
                <div
                  key={g.appId}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-steam-card border border-steam-border/60 overflow-hidden text-xs"
                >
                  <div className="relative w-14 aspect-[460/215] rounded overflow-hidden flex-shrink-0 bg-steam-navy">
                    <Image src={g.headerImage} alt={g.name} fill className="object-cover" unoptimized />
                  </div>

                  <div className="overflow-hidden flex-1">
                    <h5 className="font-medium text-white truncate" title={g.name}>{g.name}</h5>
                    <div className="mt-0.5">
                      {g.isFamilyShareable === true ? (
                        <span className="text-[10px] text-steam-green flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Family Share
                        </span>
                      ) : g.isFamilyShareable === false ? (
                        <span className="text-[10px] text-steam-danger flex items-center gap-0.5">
                          <XCircle className="w-2.5 h-2.5" /> Wykluczona
                        </span>
                      ) : (
                        <span className="text-[10px] text-steam-highlight flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 animate-spin" /> W kolejce
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
