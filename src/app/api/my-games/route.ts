import { NextResponse } from 'next/server';
import { getSteamSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getQueueStatus } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const steamId = session.steamId;

  const account = db.prepare(`
    SELECT steam_id, persona_name, avatar_url, is_public, is_submitted, total_games, shareable_games, scan_status, last_scanned_at
    FROM accounts
    WHERE steam_id = ?
  `).get(steamId) as {
    steam_id: string;
    persona_name: string;
    avatar_url: string;
    is_public: number;
    is_submitted: number;
    total_games: number;
    shareable_games: number;
    scan_status: string;
    last_scanned_at: string;
  } | undefined;

  if (!account) {
    return NextResponse.json({ isSubmitted: false });
  }

  const games = db.prepare(`
    SELECT 
      ag.app_id, 
      g.name, 
      g.header_image, 
      g.is_family_shareable, 
      g.genres, 
      ag.playtime_forever,
      sq.status as queue_status
    FROM account_games ag
    JOIN games g ON ag.app_id = g.app_id
    LEFT JOIN scan_queue sq ON ag.app_id = sq.app_id
    WHERE ag.steam_id = ?
    ORDER BY g.is_family_shareable DESC, ag.playtime_forever DESC
  `).all(steamId) as Array<{
    app_id: number;
    name: string;
    header_image: string;
    is_family_shareable: number | null;
    genres: string | null;
    playtime_forever: number;
    queue_status: string | null;
  }>;

  const parsedGames = games.map((g) => ({
    appId: g.app_id,
    name: g.name,
    headerImage: g.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${g.app_id}/header.jpg`,
    isFamilyShareable: g.is_family_shareable === 1 ? true : g.is_family_shareable === 0 ? false : null,
    genres: g.genres ? JSON.parse(g.genres) : [],
    playtimeForever: g.playtime_forever,
    queueStatus: g.queue_status || 'done',
  }));

  const shareableCount = parsedGames.filter((g) => g.isFamilyShareable === true).length;
  const excludedCount = parsedGames.filter((g) => g.isFamilyShareable === false).length;
  const pendingCount = parsedGames.filter((g) => g.isFamilyShareable === null).length;

  const queueStatus = getQueueStatus();

  return NextResponse.json({
    isSubmitted: true,
    account: {
      ...account,
      isPublic: account.is_public === 1,
    },
    stats: {
      total: parsedGames.length,
      shareable: shareableCount,
      excluded: excludedCount,
      pending: pendingCount,
    },
    queueStatus,
    games: parsedGames,
  });
}
