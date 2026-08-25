import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { db } from '@/lib/db';
import { resolveSteamId, getPlayerSummary, getOwnedGames } from '@/lib/steam';
import { queueAppIds } from '@/lib/queue';

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    const { input } = await request.json();
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json({ error: 'Podaj SteamID lub link do profilu' }, { status: 400 });
    }

    const steamId = await resolveSteamId(input);
    if (!steamId) {
      return NextResponse.json({ error: 'Nie udało się odnaleźć konta Steam na podstawie podanych danych' }, { status: 404 });
    }

    const player = await getPlayerSummary(steamId);
    const personaName = player?.personaname || `SteamUser_${steamId.slice(-4)}`;
    const avatarUrl = player?.avatarfull || player?.avatar || '';
    const profileUrl = player?.profileurl || `https://steamcommunity.com/profiles/${steamId}`;

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
      // Insert games into account_games and queue apps
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
      account: {
        steam_id: steamId,
        persona_name: personaName,
        is_public: isPublic,
        total_games: games.length,
      },
      warning: !isPublic ? 'Konto ma prywatną bibliotekę gier (0 pobranych gier). Poproś użytkownika o ustawienie „Szczegóły gry: Publiczne” w Steam.' : null
    });
  } catch (error) {
    console.error('Error adding account:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    const { steamId } = await request.json();
    if (!steamId || typeof steamId !== 'string') {
      return NextResponse.json({ error: 'Brak steamId' }, { status: 400 });
    }

    const player = await getPlayerSummary(steamId);
    const personaName = player?.personaname || `SteamUser_${steamId.slice(-4)}`;
    const avatarUrl = player?.avatarfull || player?.avatar || '';
    const profileUrl = player?.profileurl || `https://steamcommunity.com/profiles/${steamId}`;

    const { games, isPublic } = await getOwnedGames(steamId);

    // Update account
    db.prepare(`
      UPDATE accounts 
      SET persona_name = ?, avatar_url = ?, profile_url = ?, is_public = ?, total_games = ?, scan_status = ?, last_scanned_at = datetime('now')
      WHERE steam_id = ?
    `).run(
      personaName,
      avatarUrl,
      profileUrl,
      isPublic ? 1 : 0,
      games.length,
      games.length > 0 ? 'scanning' : 'completed',
      steamId
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
      account: {
        steam_id: steamId,
        persona_name: personaName,
        is_public: isPublic,
        total_games: games.length,
      },
      warning: !isPublic ? 'Konto nadal ma prywatną bibliotekę gier (0 gier).' : null,
    });
  } catch (error) {
    console.error('Error rechecking account:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steamId');

    if (!steamId) {
      return NextResponse.json({ error: 'Brak steamId' }, { status: 400 });
    }

    db.prepare('DELETE FROM user_preferences WHERE voter_steam_id = ?').run(steamId);
    db.prepare('DELETE FROM account_games WHERE steam_id = ?').run(steamId);
    db.prepare('DELETE FROM accounts WHERE steam_id = ?').run(steamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
