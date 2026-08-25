'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UserPlus, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Gamepad2, 
  ExternalLink, 
  Clock, 
  Lock, 
  Check, 
  XCircle,
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

  // Fetch current user and status
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

  // Polling if games are actively scanning
  useEffect(() => {
    if (data?.account?.scan_status === 'scanning' || (data?.stats && data.stats.pending > 0)) {
      const interval = setInterval(() => {
        fetchData();
      }, 3000);
      return () => clearInterval(interval);
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
        alert(result.error || 'Wystąpił błąd podczas zgłaszania konta');
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
        <div className="flex flex-col items-center gap-3 text-steam-blue">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-steam-card border border-steam-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-steam-blue/20 text-steam-blue flex items-center justify-center mx-auto shadow-glow-blue">
          <UserPlus className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Zgłoś konto do Rodziny Steam</h2>
          <p className="text-sm text-steam-textMuted leading-relaxed">
            Aby dołączyć swoją bibliotekę do wspólnej puli, zaloguj się bezpiecznie przez oficjalne konto Steam.
          </p>
        </div>
        <Link
          href="/api/auth/steam"
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-steam-blue to-steam-blueDark text-steam-dark hover:brightness-110 font-bold text-sm shadow-glow-blue transition-all"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.401-1.635 0-3.003-1.15-3.324-2.678L.484 15.01C1.942 20.244 6.746 24 12.44 24c6.627 0 12-5.373 12-12S19.066 0 12.44 0h-.461z" />
          </svg>
          <span>Zaloguj przez Steam</span>
        </Link>
      </div>
    );
  }

  const isSubmitted = data?.isSubmitted;
  const isScanning = data?.account?.scan_status === 'scanning' || (data?.stats && data.stats.pending > 0);
  const isPrivate = data?.account && !data.account.isPublic;

  // Filter user games for display
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
    <div className="max-w-4xl mx-auto space-y-8">
      <PrivacyHelpModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      {/* Header Profile Banner */}
      <div className="bg-steam-card border border-steam-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-steam-blue shadow-glow-blue flex-shrink-0">
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
              <h2 className="text-2xl font-black text-white">{user.personaName}</h2>
              {isSubmitted && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-steam-green/20 text-steam-green border border-steam-green/40 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Zgłoszony
                </span>
              )}
            </div>
            <p className="text-xs text-steam-textMuted font-mono mt-0.5">SteamID: {user.steamId}</p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {phase !== 'registration' && !isSubmitted ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-steam-navy/60 border border-steam-border text-steam-textMuted text-xs font-medium">
              <Lock className="w-4 h-4" />
              <span>Zgłoszenia kont są już zamknięte</span>
            </div>
          ) : !isSubmitted ? (
            <button
              onClick={handleSubmitAccount}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-steam-blue to-steam-blueDark text-steam-dark hover:brightness-110 font-black text-sm shadow-glow-blue transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Zgłaszanie...' : 'Zgłoś konto do puli'}</span>
            </button>
          ) : (
            <button
              onClick={handleSubmitAccount}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-steam-navy hover:bg-steam-card border border-steam-border text-steam-text hover:text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Odśwież gry ze Steam</span>
            </button>
          )}
        </div>
      </div>

      {/* Private Profile Warning Alert */}
      {isSubmitted && isPrivate && (
        <div className="bg-steam-danger/10 border border-steam-danger/40 rounded-2xl p-6 shadow-lg space-y-3">
          <div className="flex items-start gap-3 text-steam-danger">
            <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">Twoja biblioteka Steam jest prywatna!</h3>
              <p className="text-xs text-steam-textMuted mt-1 leading-relaxed">
                Steam API nie zwróciło listy gier, ponieważ w ustawieniach profilu Steam pole <em>Szczegóły gry (Game Details)</em> jest ustawione jako ukryte/prywatne.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-steam-danger hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Instrukcja: Jak zmienić profil na Publiczny</span>
            </button>
            <button
              onClick={handleSubmitAccount}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-steam-navy hover:bg-steam-card border border-steam-border text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Sprawdź ponownie</span>
            </button>
          </div>
        </div>
      )}

      {/* Scan Progress Bar & Stats */}
      {isSubmitted && data?.stats && !isPrivate && (
        <div className="space-y-6">
          {/* Progress Banner */}
          {isScanning && (
            <div className="bg-steam-card border border-steam-blue/40 rounded-2xl p-5 shadow-glow-blue space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-steam-blue font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Trwa sprawdzanie gier w Steam Store API (Family Sharing)...</span>
                </div>
                <span className="text-steam-textMuted font-mono">
                  {data.stats.total - data.stats.pending} / {data.stats.total}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-steam-dark overflow-hidden border border-steam-border/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-steam-blue to-steam-green transition-all duration-500"
                  style={{
                    width: `${Math.round(((data.stats.total - data.stats.pending) / (data.stats.total || 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-steam-textMuted">
                Strona sprawdza po kolei każdą grę z zachowaniem bezpiecznego odstępu czasowego (~1.2s). Wyniki aktualizują się na bieżąco!
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-steam-card p-4 rounded-xl border border-steam-border/60 text-center">
              <div className="text-2xl font-black text-white">{data.stats.total}</div>
              <div className="text-[11px] text-steam-textMuted mt-0.5">Wszystkich gier</div>
            </div>
            <div className="bg-steam-card p-4 rounded-xl border border-steam-green/30 text-center">
              <div className="text-2xl font-black text-steam-green">{data.stats.shareable}</div>
              <div className="text-[11px] text-steam-green/80 mt-0.5 flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> Współdzielone
              </div>
            </div>
            <div className="bg-steam-card p-4 rounded-xl border border-steam-danger/30 text-center">
              <div className="text-2xl font-black text-steam-danger">{data.stats.excluded}</div>
              <div className="text-[11px] text-steam-danger/80 mt-0.5 flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3" /> Wykluczone
              </div>
            </div>
            <div className="bg-steam-card p-4 rounded-xl border border-steam-border/60 text-center">
              <div className="text-2xl font-black text-steam-highlight">{data.stats.pending}</div>
              <div className="text-[11px] text-steam-highlight/80 mt-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Oczekuje
              </div>
            </div>
          </div>

          {/* Personal Games Preview */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-steam-blue" />
                <h3 className="font-bold text-white text-base">Podgląd gier z Twojego konta</h3>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-steam-dark rounded-xl border border-steam-border text-xs font-medium">
                <button
                  onClick={() => setGameTab('shareable')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    gameTab === 'shareable'
                      ? 'bg-steam-green text-steam-dark font-bold'
                      : 'text-steam-textMuted hover:text-white'
                  }`}
                >
                  Współdzielone ({data.stats.shareable})
                </button>
                <button
                  onClick={() => setGameTab('excluded')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    gameTab === 'excluded'
                      ? 'bg-steam-danger text-white font-bold'
                      : 'text-steam-textMuted hover:text-white'
                  }`}
                >
                  Wykluczone ({data.stats.excluded})
                </button>
                <button
                  onClick={() => setGameTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    gameTab === 'all'
                      ? 'bg-steam-card text-white font-bold'
                      : 'text-steam-textMuted hover:text-white'
                  }`}
                >
                  Wszystkie ({data.stats.total})
                </button>
              </div>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGames.map((g) => (
                <div
                  key={g.appId}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-steam-card border border-steam-border/60 hover:border-steam-borderHover transition-all overflow-hidden"
                >
                  <div className="relative w-16 aspect-[460/215] rounded-lg overflow-hidden flex-shrink-0 bg-steam-navy">
                    <Image src={g.headerImage} alt={g.name} fill className="object-cover" unoptimized />
                  </div>

                  <div className="overflow-hidden flex-1">
                    <h5 className="font-bold text-white text-xs truncate" title={g.name}>
                      {g.name}
                    </h5>

                    <div className="flex items-center gap-2 mt-1">
                      {g.isFamilyShareable === true ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-steam-green font-semibold">
                          <Check className="w-3 h-3" /> Family Share
                        </span>
                      ) : g.isFamilyShareable === false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-steam-danger font-semibold" title="Gra wykluczona przez wydawcę lub zewnętrzny launcher">
                          <XCircle className="w-3 h-3" /> Niedostępna w Rodzinie
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-steam-highlight font-semibold">
                          <Clock className="w-3 h-3 animate-spin" /> Sprawdzanie...
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
