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
    SELECT 
      a.steam_id, a.persona_name, a.avatar_url, a.profile_url, a.is_public, a.is_submitted, 
      a.total_games, a.shareable_games, a.scan_status, a.created_at, a.last_scanned_at,
      CASE WHEN (
        EXISTS(SELECT 1 FROM user_preferences up WHERE up.voter_steam_id = a.steam_id) OR
        EXISTS(SELECT 1 FROM account_preferences ap WHERE ap.voter_steam_id = a.steam_id AND ap.tier > 0)
      ) THEN 1 ELSE 0 END as has_voted
    FROM accounts a
    ORDER BY a.created_at DESC
  `).all();

  const uniqueShareableGames = db.prepare(`
    SELECT COUNT(DISTINCT app_id) as count 
    FROM games 
    WHERE is_family_shareable = 1
  `).get() as { count: number };

  const totalRegisteredGames = db.prepare(`
    SELECT COUNT(*) as count FROM games
  `).get() as { count: number };

  const totalShareableValue = db.prepare(`
    SELECT SUM(price_final) as total_val 
    FROM games 
    WHERE is_family_shareable = 1
  `).get() as { total_val: number };

  const totalVoters = db.prepare(`
    SELECT COUNT(DISTINCT voter_steam_id) as count 
    FROM (
      SELECT voter_steam_id FROM user_preferences
      UNION
      SELECT voter_steam_id FROM account_preferences WHERE tier > 0
    )
  `).get() as { count: number };

  const queueStatus = getQueueStatus();

  return NextResponse.json({
    phase,
    stats: {
      totalAccounts: accounts.length,
      uniqueShareableGames: uniqueShareableGames.count,
      totalRegisteredGames: totalRegisteredGames.count,
      totalShareableValueCents: totalShareableValue.total_val || 0,
      totalShareableValueFormatted: totalShareableValue.total_val > 0
        ? `${((totalShareableValue.total_val || 0) / 100).toFixed(2).replace('.', ',')} zł`
        : '0,00 zł',
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
