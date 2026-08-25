import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase().trim() || '';
  const genre = searchParams.get('genre')?.trim() || '';
  const sort = searchParams.get('sort') || 'owners'; // 'owners' | 'name' | 'playtime'

  // Fetch unique shareable games with aggregated owner counts and total playtime
  const gamesQuery = `
    SELECT 
      g.app_id, 
      g.name, 
      g.header_image, 
      g.genres, 
      g.categories,
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
    owners_count: number;
    total_playtime: number;
  }>;

  // Extract all available unique genres for filter pills
  const allGenresSet = new Set<string>();
  
  let games = rows.map((r) => {
    const genresList: string[] = r.genres ? JSON.parse(r.genres) : [];
    genresList.forEach((g) => allGenresSet.add(g));

    return {
      appId: r.app_id,
      name: r.name,
      headerImage: r.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${r.app_id}/header.jpg`,
      genres: genresList,
      ownersCount: r.owners_count,
      totalPlaytime: r.total_playtime || 0,
    };
  });

  // Apply search filter
  if (search) {
    games = games.filter((g) => g.name.toLowerCase().includes(search));
  }

  // Apply genre filter
  if (genre && genre !== 'all') {
    games = games.filter((g) => g.genres.includes(genre));
  }

  // Apply sorting
  if (sort === 'name') {
    games.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'playtime') {
    games.sort((a, b) => b.totalPlaytime - a.totalPlaytime);
  } else {
    // Default 'owners'
    games.sort((a, b) => b.ownersCount - a.ownersCount || a.name.localeCompare(b.name));
  }

  return NextResponse.json({
    total: games.length,
    genres: Array.from(allGenresSet).sort(),
    games,
  });
}
