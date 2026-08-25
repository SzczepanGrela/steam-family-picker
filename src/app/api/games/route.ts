import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const genre = searchParams.get('genre') || '';
  const sort = searchParams.get('sort') || 'popular';

  // Fetch unique family shareable games with their metrics
  const gamesQuery = `
    SELECT 
      g.app_id, 
      g.name, 
      g.header_image, 
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
      COUNT(DISTINCT ag.steam_id) as owners_count,
      SUM(ag.playtime_forever) as total_playtime
    FROM games g
    JOIN account_games ag ON g.app_id = ag.app_id
    JOIN accounts a ON ag.steam_id = a.steam_id
    WHERE g.is_family_shareable = 1 AND a.is_submitted = 1
    GROUP BY g.app_id
  `;

  const rows = db.prepare(gamesQuery).all() as Array<{
    app_id: number;
    name: string;
    header_image: string;
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
    owners_count: number;
    total_playtime: number;
  }>;

  // Extract all available unique genres and categories
  const allGenresSet = new Set<string>();
  
  // Deduplicate by normalized name (merges multi-app packages like COD Black Ops II single/multiplayer)
  const dedupedGamesMap = new Map<string, {
    appId: number;
    name: string;
    headerImage: string;
    genres: string[];
    priceFinal: number;
    priceFormatted: string;
    reviewsGlobalPercent: number;
    reviewsGlobalCount: number;
    reviewsGlobalDesc: string;
    reviewsPolishPercent: number;
    reviewsPolishCount: number;
    reviewsPolishDesc: string;
    ownersCount: number;
    totalPlaytime: number;
  }>();

  for (const r of rows) {
    const genresList: string[] = r.genres ? JSON.parse(r.genres) : [];
    genresList.forEach((g) => allGenresSet.add(g));

    const normKey = r.name.toLowerCase().trim();

    if (!dedupedGamesMap.has(normKey)) {
      dedupedGamesMap.set(normKey, {
        appId: r.app_id,
        name: r.name,
        headerImage: r.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${r.app_id}/header.jpg`,
        genres: genresList,
        priceFinal: r.price_final || 0,
        priceFormatted: r.price_formatted || (r.price_final > 0 ? `${(r.price_final / 100).toFixed(2)} zł` : ''),
        reviewsGlobalPercent: r.reviews_global_percent || 0,
        reviewsGlobalCount: r.reviews_global_count || 0,
        reviewsGlobalDesc: r.reviews_global_desc || '',
        reviewsPolishPercent: r.reviews_polish_percent || 0,
        reviewsPolishCount: r.reviews_polish_count || 0,
        reviewsPolishDesc: r.reviews_polish_desc || '',
        ownersCount: r.owners_count,
        totalPlaytime: r.total_playtime || 0,
      });
    } else {
      const existing = dedupedGamesMap.get(normKey)!;
      existing.totalPlaytime += r.total_playtime || 0;
      existing.ownersCount = Math.max(existing.ownersCount, r.owners_count);
      if ((r.price_final || 0) > existing.priceFinal) {
        existing.priceFinal = r.price_final;
        existing.priceFormatted = r.price_formatted || `${(r.price_final / 100).toFixed(2)} zł`;
      }
      if ((r.reviews_global_percent || 0) > existing.reviewsGlobalPercent) {
        existing.reviewsGlobalPercent = r.reviews_global_percent;
        existing.reviewsGlobalCount = r.reviews_global_count;
        existing.reviewsGlobalDesc = r.reviews_global_desc;
      }
    }
  }

  let games = Array.from(dedupedGamesMap.values());

  // Apply search filter
  if (search) {
    games = games.filter((g) => g.name.toLowerCase().includes(search));
  }

  // Apply genre filter
  if (genre && genre !== 'all') {
    games = games.filter((g) => g.genres.includes(genre));
  }

  // 9 Sorting Modes
  switch (sort) {
    case 'popular':
      // Najpopularniejsze (liczba recenzji globalnych)
      games.sort((a, b) => b.reviewsGlobalCount - a.reviewsGlobalCount || b.ownersCount - a.ownersCount);
      break;
    case 'score_world':
      // Najwyżej oceniane - Świat (% pozytywnych)
      games.sort((a, b) => b.reviewsGlobalPercent - a.reviewsGlobalPercent || b.reviewsGlobalCount - a.reviewsGlobalCount);
      break;
    case 'score_pl':
      // Najwyżej oceniane - Polska (% pozytywnych PL)
      games.sort((a, b) => b.reviewsPolishPercent - a.reviewsPolishPercent || b.reviewsPolishCount - a.reviewsPolishCount);
      break;
    case 'price_desc':
      // Najdroższe (cena: od najwyższej)
      games.sort((a, b) => b.priceFinal - a.priceFinal || b.reviewsGlobalCount - a.reviewsGlobalCount);
      break;
    case 'price_asc':
      // Najtańsze (cena: od najniższej, ale > 0 najpierw)
      games.sort((a, b) => (a.priceFinal || 999999) - (b.priceFinal || 999999));
      break;
    case 'owners':
      // Najwięcej posiadaczy w puli znajomych
      games.sort((a, b) => b.ownersCount - a.ownersCount || a.name.localeCompare(b.name));
      break;
    case 'playtime':
      // Najwięcej ograne (łączny czas gry)
      games.sort((a, b) => b.totalPlaytime - a.totalPlaytime || b.ownersCount - a.ownersCount);
      break;
    case 'name_desc':
      // Alfabetycznie (Z-A)
      games.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'name_asc':
    case 'name':
      // Alfabetycznie (A-Z)
      games.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      games.sort((a, b) => b.reviewsGlobalCount - a.reviewsGlobalCount || b.ownersCount - a.ownersCount);
      break;
  }

  return NextResponse.json({
    total: games.length,
    genres: Array.from(allGenresSet).sort(),
    games,
  });
}
