'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Clock, Users, UserCheck } from 'lucide-react';

export interface VoterStatusItem {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  hasVoted: boolean;
  gameVotesCount: number;
  accountPrefsCount: number;
}

interface VoterStatusWidgetProps {
  votersStatus: VoterStatusItem[];
  title?: string;
  compact?: boolean;
  isRegistrationPhase?: boolean;
}

export default function VoterStatusWidget({ 
  votersStatus, 
  title = 'Postęp wyboru w grupie', 
  compact = false,
  isRegistrationPhase = false
}: VoterStatusWidgetProps) {
  if (!votersStatus || votersStatus.length === 0) return null;

  const readyCount = votersStatus.filter((v) => v.hasVoted).length;
  const total = votersStatus.length;
  const percent = total > 0 ? Math.round((readyCount / total) * 100) : 0;

  return (
    <div className={`bg-steam-card/90 border border-steam-border/70 rounded-3xl shadow-xl space-y-3.5 ${compact ? 'p-4' : 'p-5'} animate-fadeIn`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-steam-border/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-steam-blue/15 text-steam-blue">
            {isRegistrationPhase ? <UserCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">{title}</h4>
            <p className="text-[11px] text-steam-textMuted">
              {isRegistrationPhase ? (
                <>Zgłoszono łącznie <strong className="text-steam-blue">{total}</strong> bibliotek do puli</>
              ) : (
                <>Wybrało gry: <strong className="text-steam-green">{readyCount}</strong> z <strong>{total}</strong> graczy ({percent}%)</>
              )}
            </p>
          </div>
        </div>

        {/* Progress Bar (Only during voting) */}
        {!isRegistrationPhase && (
          <div className="w-full sm:w-36 h-2 rounded-full bg-steam-dark overflow-hidden border border-steam-border/40">
            <div
              className="h-full bg-gradient-to-r from-steam-blue to-steam-green transition-all duration-500 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      {/* Avatar Grid */}
      <div className="flex flex-wrap items-center gap-2.5">
        {votersStatus.map((v) => (
          <div
            key={v.steamId}
            className="relative group flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-steam-dark/80 border border-steam-border/50 hover:border-steam-blue/50 transition-all"
            title={`${v.personaName}: ${isRegistrationPhase ? 'Biblioteka dodana do puli' : v.hasVoted ? 'Zapisane preferencje ✔️' : 'W trakcie wyboru ⏳'}`}
          >
            {/* Avatar with status corner badge */}
            <div className="relative w-7 h-7 flex-shrink-0">
              <div className={`relative w-full h-full rounded-full overflow-hidden border ${isRegistrationPhase || v.hasVoted ? 'border-steam-green' : 'border-steam-border'}`}>
                <Image
                  src={v.avatarUrl || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                  alt={v.personaName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {/* Corner Badge */}
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-steam-card flex items-center justify-center border border-steam-border shadow-sm">
                {isRegistrationPhase || v.hasVoted ? (
                  <CheckCircle2 className="w-3 h-3 text-steam-green fill-steam-green/20" />
                ) : (
                  <Clock className="w-2.5 h-2.5 text-steam-highlight" />
                )}
              </div>
            </div>

            <div className="overflow-hidden max-w-[90px]">
              <span className="block text-xs font-semibold text-white truncate">{v.personaName}</span>
              <span className={`block text-[9px] font-bold ${isRegistrationPhase || v.hasVoted ? 'text-steam-green' : 'text-steam-textMuted'}`}>
                {isRegistrationPhase ? 'W puli' : v.hasVoted ? 'Gotowy' : 'Wybiera'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
