import { NextRequest, NextResponse } from 'next/server';
import { getSteamSession } from '@/lib/session';
import { db, getSystemPhase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Wymagane zalogowanie przez Steam' }, { status: 401 });
  }

  const voterSteamId = session.steamId;

  // Fetch all saved account preferences for this voter
  const savedPrefsRows = db.prepare(`
    SELECT target_steam_id, tier, rank_order 
    FROM account_preferences 
    WHERE voter_steam_id = ?
  `).all(voterSteamId) as Array<{ target_steam_id: string; tier: number; rank_order: number }>;

  const preferencesMap: Record<string, { tier: number; rankOrder: number }> = {};
  for (const p of savedPrefsRows) {
    preferencesMap[p.target_steam_id] = {
      tier: p.tier,
      rankOrder: p.rank_order,
    };
  }

  // Fetch voter's game votes (from Step 1)
  const voterGameVotes = db.prepare(`
    SELECT app_id, score 
    FROM user_preferences 
    WHERE voter_steam_id = ?
  `).all(voterSteamId) as Array<{ app_id: number; score: number }>;

  const voterWantedAppIds = new Map<number, number>();
  for (const g of voterGameVotes) {
    if (g.score > 0) {
      voterWantedAppIds.set(g.app_id, g.score);
    }
  }

  // Fetch all other submitted accounts (EXCLUDING the voter's own account!)
  const otherAccounts = db.prepare(`
    SELECT steam_id, persona_name, avatar_url, profile_url, total_games, shareable_games, scan_status
    FROM accounts
    WHERE is_submitted = 1 AND steam_id != ?
    ORDER BY shareable_games DESC
  `).all(voterSteamId) as Array<{
    steam_id: string;
    persona_name: string;
    avatar_url: string;
    profile_url: string;
    total_games: number;
    shareable_games: number;
    scan_status: string;
  }>;

  // For each account, find which of the voter's wanted games this account has
  const accountsWithMatches = otherAccounts.map((acc) => {
    const accountGames = db.prepare(`
      SELECT 
        g.app_id, 
        g.name, 
        g.header_image, 
        COALESCE(g.price_formatted, '') as price_formatted,
        COALESCE(g.reviews_global_percent, 0) as reviews_global_percent,
        COALESCE(g.reviews_global_desc, '') as reviews_global_desc,
        COALESCE(g.reviews_polish_percent, 0) as reviews_polish_percent,
        COALESCE(g.reviews_polish_desc, '') as reviews_polish_desc,
        ag.playtime_forever
      FROM account_games ag
      JOIN games g ON ag.app_id = g.app_id
      WHERE ag.steam_id = ? AND g.is_family_shareable = 1
    `).all(acc.steam_id) as Array<{
      app_id: number;
      name: string;
      header_image: string;
      price_formatted: string;
      reviews_global_percent: number;
      reviews_global_desc: string;
      reviews_polish_percent: number;
      reviews_polish_desc: string;
      playtime_forever: number;
    }>;

    const matchedGames: Array<{
      appId: number;
      name: string;
      headerImage: string;
      priceFormatted: string;
      reviewsGlobalPercent: number;
      reviewsGlobalDesc: string;
      reviewsPolishPercent: number;
      reviewsPolishDesc: string;
      voterScore: number;
    }> = [];

    for (const g of accountGames) {
      if (voterWantedAppIds.has(g.app_id)) {
        matchedGames.push({
          appId: g.app_id,
          name: g.name,
          headerImage: g.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${g.app_id}/header.jpg`,
          priceFormatted: g.price_formatted,
          reviewsGlobalPercent: g.reviews_global_percent,
          reviewsGlobalDesc: g.reviews_global_desc,
          reviewsPolishPercent: g.reviews_polish_percent,
          reviewsPolishDesc: g.reviews_polish_desc,
          voterScore: voterWantedAppIds.get(g.app_id) || 1,
        });
      }
    }

    // Sort matched games by voter score (Must-Have first), then by global review score
    matchedGames.sort((a, b) => b.voterScore - a.voterScore || b.reviewsGlobalPercent - a.reviewsGlobalPercent);

    const pref = preferencesMap[acc.steam_id];

    return {
      steamId: acc.steam_id,
      personaName: acc.persona_name,
      avatarUrl: acc.avatar_url,
      profileUrl: acc.profile_url,
      totalGames: acc.total_games,
      shareableGames: acc.shareable_games,
      scanStatus: acc.scan_status,
      tier: pref ? pref.tier : 0,
      rankOrder: pref ? pref.rankOrder : 0,
      matchedGamesCount: matchedGames.length,
      matchedGames,
      allShareableGamesCount: accountGames.length,
    };
  });

  return NextResponse.json({
    voterSteamId,
    voterWantedGamesCount: voterWantedAppIds.size,
    preferences: preferencesMap,
    accounts: accountsWithMatches,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSteamSession();
  if (!session) {
    return NextResponse.json({ error: 'Wymagane zalogowanie przez Steam' }, { status: 401 });
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

  const voterSteamId = session.steamId;

  try {
    const body = await request.json();
    const { preferences } = body as {
      preferences: Array<{
        targetSteamId: string;
        tier: number;
        rankOrder?: number;
      }>;
    };

    if (!Array.isArray(preferences)) {
      return NextResponse.json({ error: 'Nieprawidłowy format danych' }, { status: 400 });
    }

    const upsertPref = db.prepare(`
      INSERT INTO account_preferences (voter_steam_id, target_steam_id, tier, rank_order, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(voter_steam_id, target_steam_id) DO UPDATE SET
        tier = excluded.tier,
        rank_order = excluded.rank_order,
        updated_at = datetime('now')
    `);

    for (const p of preferences) {
      if (typeof p.targetSteamId !== 'string' || typeof p.tier !== 'number') {
        continue;
      }

      // Security check: NEVER allow voting for self
      if (p.targetSteamId === voterSteamId) {
        continue;
      }

      const rankOrder = typeof p.rankOrder === 'number' ? p.rankOrder : 0;
      upsertPref.run(voterSteamId, p.targetSteamId, p.tier, rankOrder);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving account preferences:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
