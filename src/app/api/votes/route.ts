import { NextRequest, NextResponse } from 'next/server';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ votes: {} });
  }

  const rows = db.prepare(`
    SELECT app_id, score 
    FROM user_preferences 
    WHERE voter_steam_id = ?
  `).all(session.steamId) as Array<{ app_id: number; score: number }>;

  const votes: Record<number, number> = {};
  for (const r of rows) {
    votes[r.app_id] = r.score;
  }

  return NextResponse.json({ votes });
}

export async function POST(request: NextRequest) {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Zaloguj się, aby głosować' }, { status: 401 });
  }

  const phase = getSystemPhase();
  if (phase !== 'voting') {
    return NextResponse.json({ error: 'Głosowanie jest obecnie zablokowane' }, { status: 400 });
  }

  try {
    const { appId, score } = await request.json(); // score: 3 (must-have), 1 (interested), 0 (remove)

    if (typeof appId !== 'number' || !Number.isInteger(appId) || appId <= 0) {
      return NextResponse.json({ error: 'Nieprawidłowy identyfikator gry' }, { status: 400 });
    }
    if (![0, 1, 3].includes(score)) {
      return NextResponse.json({ error: 'Nieprawidłowa wartość głosu (dozwolone: 0, 1, 3)' }, { status: 400 });
    }

    if (score === 0) {
      db.prepare(`
        DELETE FROM user_preferences 
        WHERE voter_steam_id = ? AND app_id = ?
      `).run(session.steamId, appId);
    } else {
      db.prepare(`
        INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(voter_steam_id, app_id) DO UPDATE SET
          score = excluded.score,
          updated_at = datetime('now')
      `).run(session.steamId, appId, score);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving vote:', error);
    return NextResponse.json({ error: 'Błąd zapisu preferencji' }, { status: 500 });
  }
}
