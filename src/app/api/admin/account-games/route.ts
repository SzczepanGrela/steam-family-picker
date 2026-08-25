import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const steamId = searchParams.get('steamId');

  if (!steamId) {
    return NextResponse.json({ error: 'Brak parametru steamId' }, { status: 400 });
  }

  // Get account info
  const account = db.prepare(`
    SELECT steam_id, persona_name, avatar_url, profile_url, is_public, total_games, shareable_games, scan_status
    FROM accounts
    WHERE steam_id = ?
  `).get(steamId) as {
    steam_id: string;
    persona_name: string;
    avatar_url: string;
    profile_url: string;
    is_public: number;
    total_games: number;
    shareable_games: number;
    scan_status: string;
  } | undefined;

  if (!account) {
    return NextResponse.json({ error: 'Nie znaleziono konta' }, { status: 404 });
  }

  // Fetch games owned by this account
  const gamesRows = db.prepare(`
    SELECT 
      g.app_id, 
      g.name, 
      g.header_image, 
      g.is_family_shareable, 
      g.genres, 
      g.categories,
      COALESCE(g.price_final, 0) as price_final,
      COALESCE(g.price_formatted, '') as price_formatted,
      COALESCE(g.reviews_global_percent, 0) as reviews_global_percent,
      COALESCE(g.reviews_global_count, 0) as reviews_global_count,
      COALESCE(g.reviews_global_desc, '') as reviews_global_desc,
      COALESCE(g.reviews_polish_percent, 0) as reviews_polish_percent,
      COALESCE(g.reviews_polish_count, 0) as reviews_polish_count,
      COALESCE(g.reviews_polish_desc, '') as reviews_polish_desc,
      ag.playtime_forever
    FROM account_games ag
    JOIN games g ON ag.app_id = g.app_id
    WHERE ag.steam_id = ?
    ORDER BY g.is_family_shareable DESC, ag.playtime_forever DESC
  `).all(steamId) as Array<{
    app_id: number;
    name: string;
    header_image: string;
    is_family_shareable: number | null;
    genres: string | null;
    categories: string | null;
    price_final: number;
    price_formatted: string;
    reviews_global_percent: number;
    reviews_global_count: number;
    reviews_global_desc: string;
    reviews_polish_percent: number;
    reviews_polish_count: number;
    reviews_polish_desc: string;
    playtime_forever: number;
  }>;

  // Deduplicate entries with identical normalized name (e.g. COD Black Ops II singleplayer & multiplayer)
  const dedupedMap = new Map<string, {
    appId: number;
    name: string;
    headerImage: string;
    isFamilyShareable: boolean;
    isExcluded: boolean;
    isPending: boolean;
    genres: string[];
    priceFinal: number;
    priceFormatted: string;
    reviewsGlobalPercent: number;
    reviewsGlobalCount: number;
    reviewsGlobalDesc: string;
    reviewsPolishPercent: number;
    reviewsPolishCount: number;
    reviewsPolishDesc: string;
    playtimeForever: number;
  }>();

  for (const r of gamesRows) {
    const normKey = r.name.toLowerCase().trim();
    const isShareable = r.is_family_shareable === 1;
    const isExcluded = r.is_family_shareable === 0;
    const isPending = r.is_family_shareable === null;

    if (!dedupedMap.has(normKey)) {
      dedupedMap.set(normKey, {
        appId: r.app_id,
        name: r.name,
        headerImage: r.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${r.app_id}/header.jpg`,
        isFamilyShareable: isShareable,
        isExcluded: isExcluded,
        isPending: isPending,
        genres: r.genres ? JSON.parse(r.genres) : [],
        priceFinal: r.price_final,
        priceFormatted: r.price_formatted || (r.price_final > 0 ? `${(r.price_final / 100).toFixed(2)} zł` : ''),
        reviewsGlobalPercent: r.reviews_global_percent,
        reviewsGlobalCount: r.reviews_global_count,
        reviewsGlobalDesc: r.reviews_global_desc,
        reviewsPolishPercent: r.reviews_polish_percent,
        reviewsPolishCount: r.reviews_polish_count,
        reviewsPolishDesc: r.reviews_polish_desc,
        playtimeForever: r.playtime_forever,
      });
    } else {
      const existing = dedupedMap.get(normKey)!;
      // Accumulate playtime
      existing.playtimeForever += r.playtime_forever;
      // If either component is shareable, the game is shareable
      if (isShareable) {
        existing.isFamilyShareable = true;
        existing.isExcluded = false;
        existing.isPending = false;
      }
      // Take best price/reviews if existing has 0
      if (r.price_final > existing.priceFinal) {
        existing.priceFinal = r.price_final;
        existing.priceFormatted = r.price_formatted || `${(r.price_final / 100).toFixed(2)} zł`;
      }
      if (r.reviews_global_percent > existing.reviewsGlobalPercent) {
        existing.reviewsGlobalPercent = r.reviews_global_percent;
        existing.reviewsGlobalCount = r.reviews_global_count;
        existing.reviewsGlobalDesc = r.reviews_global_desc;
      }
      if (r.reviews_polish_percent > existing.reviewsPolishPercent) {
        existing.reviewsPolishPercent = r.reviews_polish_percent;
        existing.reviewsPolishCount = r.reviews_polish_count;
        existing.reviewsPolishDesc = r.reviews_polish_desc;
      }
    }
  }

  const games = Array.from(dedupedMap.values());

  return NextResponse.json({
    account,
    total: games.length,
    shareableCount: games.filter((g) => g.isFamilyShareable).length,
    excludedCount: games.filter((g) => g.isExcluded).length,
    pendingCount: games.filter((g) => g.isPending).length,
    games,
  });
}
