import { NextResponse } from 'next/server';
import { getSteamSession } from '@/lib/session';
import { getSteamWishlist } from '@/lib/steam';
import { db, getSystemPhase } from '@/lib/db';

export async function POST() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Zaloguj się przez Steam' }, { status: 401 });
  }

  const phase = getSystemPhase();
  if (phase !== 'voting') {
    return NextResponse.json({ error: 'Głosowanie nie jest obecnie aktywne' }, { status: 400 });
  }

  try {
    const steamId = session.steamId;
    const wishlistAppIds = await getSteamWishlist(steamId);

    if (wishlistAppIds.length === 0) {
      return NextResponse.json({
        success: true,
        importedCount: 0,
        message: 'Twoja lista życzeń na Steam jest pusta lub prywatna',
      });
    }

    // Filter to only games that exist in our pool of shareable games
    const checkGame = db.prepare(`
      SELECT app_id FROM games WHERE app_id = ? AND is_family_shareable = 1
    `);

    const insertVote = db.prepare(`
      INSERT INTO user_preferences (voter_steam_id, app_id, score, updated_at)
      VALUES (?, ?, 3, datetime('now'))
      ON CONFLICT(voter_steam_id, app_id) DO UPDATE SET
        score = 3,
        updated_at = datetime('now')
    `);

    let importedCount = 0;
    for (const appId of wishlistAppIds) {
      const match = checkGame.get(appId);
      if (match) {
        insertVote.run(steamId, appId);
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      totalWishlist: wishlistAppIds.length,
      message: `Pomyślnie zaimportowano ${importedCount} gier z Twojej listy życzeń Steam jako Must-Have (⭐)!`,
    });
  } catch (error) {
    console.error('Error importing wishlist:', error);
    return NextResponse.json({ error: 'Błąd podczas importowania listy życzeń' }, { status: 500 });
  }
}
