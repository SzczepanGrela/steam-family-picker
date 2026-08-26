import { NextRequest, NextResponse } from 'next/server';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ votes: {}, wishlistAppIds: [] });
  }

  const rows = db.prepare(`
    SELECT app_id, score 
    FROM user_preferences 
    WHERE voter_steam_id = ?
  `).all(session.steamId) as Array<{ app_id: number; score: number }>;

  const wishlistRows = db.prepare(`
    SELECT app_id 
    FROM user_wishlists 
    WHERE voter_steam_id = ?
  `).all(session.steamId) as Array<{ app_id: number }>;

  const votes: Record<number, number> = {};
  for (const r of rows) {
    votes[r.app_id] = r.score;
  }

  const wishlistAppIds = wishlistRows.map((r) => r.app_id);

  return NextResponse.json({ votes, wishlistAppIds });
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

  // Security check: Only accounts registered in Phase 1 can participate
  const account = db.prepare('SELECT is_submitted FROM accounts WHERE steam_id = ?').get(session.steamId) as { is_submitted: number } | undefined;
  if (!account || account.is_submitted !== 1) {
    return NextResponse.json({ error: 'Tylko konta zgłoszone w Fazie 1 mogą brać udział w głosowaniu' }, { status: 403 });
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

export async function DELETE() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Zaloguj się, aby zresetować głosy' }, { status: 401 });
  }

  const phase = getSystemPhase();
  if (phase !== 'voting') {
    return NextResponse.json({ error: 'Głosowanie jest obecnie zablokowane' }, { status: 400 });
  }

  try {
    // Clear all game votes and imported wishlist marks for this user
    db.prepare('DELETE FROM user_preferences WHERE voter_steam_id = ?').run(session.steamId);
    db.prepare('DELETE FROM user_wishlists WHERE voter_steam_id = ?').run(session.steamId);

    return NextResponse.json({ success: true, message: 'Wszystkie zaznaczone gry zostały usunięte' });
  } catch (error) {
    console.error('Error clearing votes:', error);
    return NextResponse.json({ error: 'Błąd czyszczenia preferencji' }, { status: 500 });
  }
}
