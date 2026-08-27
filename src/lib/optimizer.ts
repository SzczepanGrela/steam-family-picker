import { db } from './db';

export interface AccountRankItem {
  rank: number;
  steam_id: string;
  persona_name: string;
  avatar_url: string;
  profile_url: string;
  total_games: number;
  shareable_games: number;
  shareable_value_cents: number;
  shareable_value_formatted: string;
  total_score: number;
  score_percent: number;
  voter_count: number;
  direct_pref_points: number;
  game_demand_points: number;
  top_games: Array<{
    app_id: number;
    name: string;
    header_image: string;
    price_formatted: string;
    reviews_global_percent: number;
  }>;
}

export interface Top10ResultsData {
  topAccounts: AccountRankItem[];
  totalVoters: number;
  totalSubmittedAccounts: number;
  totalUniqueShareableGames: number;
  totalShareableValueCents: number;
  totalShareableValueFormatted: string;
  top6UniqueGamesCount: number;
  top6TotalValueCents: number;
  top6TotalValueFormatted: string;
  // Keep top5 for backward compatibility if needed
  top5UniqueGamesCount?: number;
  top5TotalValueCents?: number;
  top5TotalValueFormatted?: string;
  topGamesRequested: Array<{
    app_id: number;
    name: string;
    header_image: string;
    price_formatted: string;
    reviews_global_percent: number;
    requested_by_count: number;
    available_on_accounts: string[];
    isAvailableInTop6: boolean;
    top6Owners: string[];
  }>;
}

export function calculateTop10Results(): Top10ResultsData | null {
  // 1. Fetch all submitted accounts
  const accounts = db.prepare(`
    SELECT steam_id, persona_name, avatar_url, profile_url, total_games, shareable_games
    FROM accounts
    WHERE is_submitted = 1
  `).all() as Array<{
    steam_id: string;
    persona_name: string;
    avatar_url: string;
    profile_url: string;
    total_games: number;
    shareable_games: number;
  }>;

  if (accounts.length === 0) {
    return null;
  }

  // 2. Fetch voter counts (distinct voters with officially submitted ballots)
  const totalVotersCount = (db.prepare(`
    SELECT COUNT(*) as count FROM ballot_submissions
  `).get() as { count: number })?.count || 0;

  // 3. Compute Normalized Mid-Rank Borda points per voter (ONLY from officially submitted ballots)
  const allAccountPrefs = db.prepare(`
    SELECT ap.voter_steam_id, ap.target_steam_id, ap.tier, ap.rank_order
    FROM account_preferences ap
    JOIN ballot_submissions bs ON ap.voter_steam_id = bs.voter_steam_id
    ORDER BY ap.voter_steam_id ASC
  `).all() as Array<{ voter_steam_id: string; target_steam_id: string; tier: number; rank_order: number }>;

  const prefsByVoter = new Map<string, Array<{ target_steam_id: string; tier: number }>>();
  for (const p of allAccountPrefs) {
    if (!prefsByVoter.has(p.voter_steam_id)) {
      prefsByVoter.set(p.voter_steam_id, []);
    }
    prefsByVoter.get(p.voter_steam_id)!.push({
      target_steam_id: p.target_steam_id,
      tier: p.tier,
    });
  }

  const directVotesMap = new Map<string, { points: number; count: number }>();
  for (const acc of accounts) {
    directVotesMap.set(acc.steam_id, { points: 0, count: 0 });
  }

  for (const [voterSteamId, voterPrefs] of prefsByVoter.entries()) {
    // Filter out self-preferences
    const candidates = voterPrefs.filter((p) => p.target_steam_id !== voterSteamId);
    const k = candidates.length;
    if (k === 0) continue;

    // Group candidates by tier descending (Tier 3 -> Tier 2 -> Tier 1 -> Tier 0)
    const tierGroups = new Map<number, string[]>();
    for (const c of candidates) {
      if (!tierGroups.has(c.tier)) tierGroups.set(c.tier, []);
      tierGroups.get(c.tier)!.push(c.target_steam_id);
    }

    const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => b - a);

    let currentRankIndex = 1;
    for (const t of sortedTiers) {
      const group = tierGroups.get(t)!;
      const groupSize = group.length;
      // Mid-rank for tied candidates: average of positions [currentRankIndex ... currentRankIndex + groupSize - 1]
      const midRank = currentRankIndex + (groupSize - 1) / 2;

      // Normalized Borda score (0..100): 100 for top rank 1, 0 for bottom rank k
      const bordaScore = k > 1 ? Math.round(((k - midRank) / (k - 1)) * 100) : 100;

      for (const targetId of group) {
        if (directVotesMap.has(targetId)) {
          const current = directVotesMap.get(targetId)!;
          current.points += bordaScore;
          if (t > 0) current.count += 1;
        }
      }

      currentRankIndex += groupSize;
    }
  }

  // 4. Fetch game-level demand scores from officially submitted ballots
  const gameVotesRows = db.prepare(`
    SELECT up.app_id, SUM(up.score) as game_score, COUNT(DISTINCT up.voter_steam_id) as requested_by
    FROM user_preferences up
    JOIN ballot_submissions bs ON up.voter_steam_id = bs.voter_steam_id
    WHERE up.score > 0
    GROUP BY up.app_id
  `).all() as Array<{ app_id: number; game_score: number; requested_by: number }>;

  const gameScoreMap = new Map<number, { score: number; requestedBy: number }>();
  for (const g of gameVotesRows) {
    gameScoreMap.set(g.app_id, { score: g.game_score, requestedBy: g.requested_by });
  }

  // 5. Fetch all shareable games per account
  const accountGamesRows = db.prepare(`
    SELECT 
      ag.steam_id, 
      g.app_id, 
      g.name, 
      g.header_image,
      COALESCE(g.price_final, 0) as price_final,
      COALESCE(g.price_formatted, '') as price_formatted,
      COALESCE(g.reviews_global_percent, 0) as reviews_global_percent
    FROM account_games ag
    JOIN games g ON ag.app_id = g.app_id
    WHERE g.is_family_shareable = 1
  `).all() as Array<{
    steam_id: string;
    app_id: number;
    name: string;
    header_image: string;
    price_final: number;
    price_formatted: string;
    reviews_global_percent: number;
  }>;

  const gamesByAccount = new Map<string, Array<{
    app_id: number;
    name: string;
    header_image: string;
    price_final: number;
    price_formatted: string;
    reviews_global_percent: number;
    gameScore: number;
  }>>();

  const gameOwnersMap = new Map<number, Set<string>>();
  const gamePriceMap = new Map<number, number>();

  for (const row of accountGamesRows) {
    if (!gamesByAccount.has(row.steam_id)) {
      gamesByAccount.set(row.steam_id, []);
    }

    const gInfo = gameScoreMap.get(row.app_id);
    const score = gInfo ? gInfo.score : 0;

    gamesByAccount.get(row.steam_id)!.push({
      app_id: row.app_id,
      name: row.name,
      header_image: row.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${row.app_id}/header.jpg`,
      price_final: row.price_final,
      price_formatted: row.price_formatted,
      reviews_global_percent: row.reviews_global_percent,
      gameScore: score,
    });

    if (!gameOwnersMap.has(row.app_id)) {
      gameOwnersMap.set(row.app_id, new Set());
    }
    gameOwnersMap.get(row.app_id)!.add(row.steam_id);
    gamePriceMap.set(row.app_id, row.price_final);
  }

  // 6. Calculate total score per account (Borda Mid-Rank Points + Game Demand Points)
  const rankedList: Array<{
    steam_id: string;
    persona_name: string;
    avatar_url: string;
    profile_url: string;
    total_games: number;
    shareable_games: number;
    shareable_value_cents: number;
    shareable_value_formatted: string;
    total_score: number;
    direct_pref_points: number;
    game_demand_points: number;
    voter_count: number;
    top_games: Array<{
      app_id: number;
      name: string;
      header_image: string;
      price_formatted: string;
      reviews_global_percent: number;
    }>;
  }> = [];

  for (const acc of accounts) {
    const direct = directVotesMap.get(acc.steam_id) || { points: 0, count: 0 };
    const games = gamesByAccount.get(acc.steam_id) || [];

    // Sum game demand points and total shareable value
    let gameDemandPoints = 0;
    let shareableValueCents = 0;
    for (const g of games) {
      gameDemandPoints += g.gameScore;
      shareableValueCents += g.price_final;
    }

    // Sort games by demand score descending, then by global reviews
    games.sort((a, b) => b.gameScore - a.gameScore || b.reviews_global_percent - a.reviews_global_percent);

    const totalScore = direct.points + gameDemandPoints;

    rankedList.push({
      steam_id: acc.steam_id,
      persona_name: acc.persona_name,
      avatar_url: acc.avatar_url,
      profile_url: acc.profile_url,
      total_games: acc.total_games,
      shareable_games: acc.shareable_games,
      shareable_value_cents: shareableValueCents,
      shareable_value_formatted: shareableValueCents > 0 ? `${(shareableValueCents / 100).toFixed(2).replace('.', ',')} zł` : '0,00 zł',
      total_score: totalScore,
      direct_pref_points: direct.points,
      game_demand_points: gameDemandPoints,
      voter_count: direct.count,
      top_games: games.slice(0, 5).map((g) => ({
        app_id: g.app_id,
        name: g.name,
        header_image: g.header_image,
        price_formatted: g.price_formatted,
        reviews_global_percent: g.reviews_global_percent,
      })),
    });
  }

  // Sort ranked accounts descending by score, tiebreaker: shareable games count
  rankedList.sort((a, b) => b.total_score - a.total_score || b.shareable_games - a.shareable_games);

  const maxScore = Math.max(...rankedList.map((a) => a.total_score), 1);

  // Rank all submitted accounts
  const allRankedAccounts = rankedList.map((acc, index) => ({
    ...acc,
    rank: index + 1,
    score_percent: maxScore > 0 ? Math.round((acc.total_score / maxScore) * 100) : 100,
  }));

  // Calculate TOP 6 (Full Steam Family size) unique games and value
  const top6 = allRankedAccounts.slice(0, 6);
  const top6SteamIds = new Set(top6.map((a) => a.steam_id));
  const top6UniqueGamesSet = new Set<number>();
  for (const acc of top6) {
    const accGames = gamesByAccount.get(acc.steam_id) || [];
    for (const g of accGames) {
      top6UniqueGamesSet.add(g.app_id);
    }
  }

  const top6UniqueGamesCount = top6UniqueGamesSet.size;
  let top6TotalValueCents = 0;
  for (const appId of top6UniqueGamesSet) {
    top6TotalValueCents += gamePriceMap.get(appId) || 0;
  }
  const top6TotalValueFormatted = top6TotalValueCents > 0
    ? `${(top6TotalValueCents / 100).toFixed(2).replace('.', ',')} zł`
    : '0,00 zł';

  // 7. Find top requested games overall
  const accountsNameMap = new Map(accounts.map((a) => [a.steam_id, a.persona_name]));
  const topGamesRequested: Top10ResultsData['topGamesRequested'] = [];

  const uniqueGamesRows = db.prepare(`
    SELECT app_id, name, header_image, COALESCE(price_final, 0) as price_final, price_formatted, reviews_global_percent
    FROM games
    WHERE is_family_shareable = 1
  `).all() as Array<{
    app_id: number;
    name: string;
    header_image: string;
    price_final: number;
    price_formatted: string;
    reviews_global_percent: number;
  }>;

  let totalShareableValueCents = 0;
  for (const g of uniqueGamesRows) {
    totalShareableValueCents += g.price_final;
    const gScore = gameScoreMap.get(g.app_id);
    if (gScore && gScore.requestedBy > 0) {
      const ownersSet = gameOwnersMap.get(g.app_id) || new Set();
      const ownerNames = Array.from(ownersSet).map((id) => accountsNameMap.get(id) || id);
      const top6OwnerNames = Array.from(ownersSet)
        .filter((id) => top6SteamIds.has(id))
        .map((id) => accountsNameMap.get(id) || id);
      const isAvailableInTop6 = top6OwnerNames.length > 0;

      topGamesRequested.push({
        app_id: g.app_id,
        name: g.name,
        header_image: g.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${g.app_id}/header.jpg`,
        price_formatted: g.price_formatted || '',
        reviews_global_percent: g.reviews_global_percent || 0,
        requested_by_count: gScore.requestedBy,
        available_on_accounts: ownerNames,
        isAvailableInTop6,
        top6Owners: top6OwnerNames,
      });
    }
  }

  topGamesRequested.sort((a, b) => b.requested_by_count - a.requested_by_count || b.reviews_global_percent - a.reviews_global_percent);

  const totalUniqueShareable = uniqueGamesRows.length;
  const totalShareableValueFormatted = totalShareableValueCents > 0
    ? `${(totalShareableValueCents / 100).toFixed(2).replace('.', ',')} zł`
    : '0,00 zł';

  return {
    topAccounts: allRankedAccounts,
    totalVoters: totalVotersCount,
    totalSubmittedAccounts: accounts.length,
    totalUniqueShareableGames: totalUniqueShareable,
    totalShareableValueCents,
    totalShareableValueFormatted,
    top6UniqueGamesCount,
    top6TotalValueCents,
    top6TotalValueFormatted,
    top5UniqueGamesCount: top6UniqueGamesCount,
    top5TotalValueCents: top6TotalValueCents,
    top5TotalValueFormatted: top6TotalValueFormatted,
    topGamesRequested,
  };
}

// Backward compatibility helper
export function calculateOptimalFamily() {
  return calculateTop10Results();
}
