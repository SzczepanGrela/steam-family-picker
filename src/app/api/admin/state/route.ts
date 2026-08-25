import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { db, getSystemPhase, setSystemPhase, PhaseType } from '@/lib/db';
import { getQueueStatus } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const phase = getSystemPhase();

  const accounts = db.prepare(`
    SELECT steam_id, persona_name, avatar_url, profile_url, is_public, is_submitted, total_games, shareable_games, scan_status, created_at, last_scanned_at
    FROM accounts
    ORDER BY created_at DESC
  `).all();

  const uniqueShareableGames = db.prepare(`
    SELECT COUNT(DISTINCT app_id) as count 
    FROM games 
    WHERE is_family_shareable = 1
  `).get() as { count: number };

  const totalRegisteredGames = db.prepare(`
    SELECT COUNT(*) as count FROM games
  `).get() as { count: number };

  const totalVoters = db.prepare(`
    SELECT COUNT(DISTINCT voter_steam_id) as count FROM user_preferences
  `).get() as { count: number };

  const queueStatus = getQueueStatus();

  return NextResponse.json({
    phase,
    stats: {
      totalAccounts: accounts.length,
      uniqueShareableGames: uniqueShareableGames.count,
      totalRegisteredGames: totalRegisteredGames.count,
      totalVoters: totalVoters.count,
    },
    accounts,
    queueStatus,
  });
}

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    const { phase } = await request.json();
    if (!['registration', 'voting', 'completed'].includes(phase)) {
      return NextResponse.json({ error: 'Nieprawidłowa faza' }, { status: 400 });
    }

    setSystemPhase(phase as PhaseType);
    return NextResponse.json({ success: true, phase });
  } catch (error) {
    console.error('Error changing phase:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
