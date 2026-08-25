import { NextResponse } from 'next/server';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';
import { getPlayerSummary, getOwnedGames } from '@/lib/steam';
import { queueAppIds } from '@/lib/queue';

export async function POST() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Zaloguj się przez Steam, aby zgłosić konto' }, { status: 401 });
  }

  const phase = getSystemPhase();
  if (phase !== 'registration') {
    return NextResponse.json({ error: 'Zgłoszenia kont są obecnie zamknięte' }, { status: 400 });
  }

  try {
    const steamId = session.steamId;
    const player = await getPlayerSummary(steamId);
    const personaName = player?.personaname || session.personaName;
    const avatarUrl = player?.avatarfull || player?.avatar || session.avatarUrl;
    const profileUrl = player?.profileurl || session.profileUrl;

    const { games, isPublic } = await getOwnedGames(steamId);

    // Save account
    db.prepare(`
      INSERT INTO accounts (steam_id, persona_name, avatar_url, profile_url, is_public, is_submitted, total_games, scan_status, created_at, last_scanned_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(steam_id) DO UPDATE SET
        persona_name = excluded.persona_name,
        avatar_url = excluded.avatar_url,
        profile_url = excluded.profile_url,
        is_public = excluded.is_public,
        is_submitted = 1,
        total_games = excluded.total_games,
        scan_status = excluded.scan_status,
        last_scanned_at = excluded.last_scanned_at
    `).run(
      steamId,
      personaName,
      avatarUrl,
      profileUrl,
      isPublic ? 1 : 0,
      games.length,
      games.length > 0 ? 'scanning' : 'completed'
    );

    if (games.length > 0) {
      const insertAccountGame = db.prepare(`
        INSERT OR REPLACE INTO account_games (steam_id, app_id, playtime_forever)
        VALUES (?, ?, ?)
      `);

      const insertGameStub = db.prepare(`
        INSERT INTO games (app_id, name, header_image)
        VALUES (?, ?, ?)
        ON CONFLICT(app_id) DO UPDATE SET
          name = CASE WHEN excluded.name != '' AND excluded.name NOT LIKE 'App %' THEN excluded.name ELSE games.name END
      `);

      for (const g of games) {
        insertGameStub.run(g.appid, g.name, `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`);
        insertAccountGame.run(steamId, g.appid, g.playtime_forever);
      }

      queueAppIds(games.map((g) => g.appid));
    }

    return NextResponse.json({
      success: true,
      isPublic,
      totalGames: games.length,
      account: {
        steamId,
        personaName,
        avatarUrl,
        isPublic,
        totalGames: games.length,
      },
    });
  } catch (error) {
    console.error('Error submitting account:', error);
    return NextResponse.json({ error: 'Błąd podczas zgłaszania konta' }, { status: 500 });
  }
}
