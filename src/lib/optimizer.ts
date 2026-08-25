import { db } from './db';

export interface AccountRankItem {
  rank: number;
  steam_id: string;
  persona_name: string;
  avatar_url: string;
  profile_url: string;
  total_games: number;
  shareable_games: number;
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
  topGamesRequested: Array<{
    app_id: number;
    name: string;
    header_image: string;
    price_formatted: string;
    reviews_global_percent: number;
    requested_by_count: number;
    available_on_accounts: string[];
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

  // 2. Fetch voter counts (distinct voters across both account_preferences and user_preferences)
  const totalVotersCount = (db.prepare(`
    SELECT COUNT(DISTINCT voter_steam_id) as count 
    FROM (
      SELECT voter_steam_id FROM user_preferences
      UNION
      SELECT voter_steam_id FROM account_preferences
    )
  `).get() as { count: number })?.count || 0;

  // 3. Fetch direct account votes from account_preferences
  const directVotesRows = db.prepare(`
    SELECT target_steam_id, SUM(tier) as total_tier_points, COUNT(voter_steam_id) as voter_count
    FROM account_preferences
    WHERE tier > 0
    GROUP BY target_steam_id
  `).all() as Array<{ target_steam_id: string; total_tier_points: number; voter_count: number }>;

  const directVotesMap = new Map<string, { points: number; count: number }>();
  for (const r of directVotesRows) {
    directVotesMap.set(r.target_steam_id, {
      points: r.total_tier_points * 10, // Weight direct account preferences
      count: r.voter_count,
    });
  }

  // 4. Fetch game-level demand scores from user_preferences
  const gameVotesRows = db.prepare(`
    SELECT app_id, SUM(score) as game_score, COUNT(DISTINCT voter_steam_id) as requested_by
    FROM user_preferences
    WHERE score > 0
    GROUP BY app_id
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
    price_formatted: string;
    reviews_global_percent: number;
  }>;

  const gamesByAccount = new Map<string, Array<{
    app_id: number;
    name: string;
    header_image: string;
    price_formatted: string;
    reviews_global_percent: number;
    gameScore: number;
  }>>();

  const gameOwnersMap = new Map<number, Set<string>>();

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
      price_formatted: row.price_formatted,
      reviews_global_percent: row.reviews_global_percent,
      gameScore: score,
    });

    if (!gameOwnersMap.has(row.app_id)) {
      gameOwnersMap.set(row.app_id, new Set());
    }
    gameOwnersMap.get(row.app_id)!.add(row.steam_id);
  }

  // 6. Calculate total score per account
  const rankedList: Array<{
    steam_id: string;
    persona_name: string;
    avatar_url: string;
    profile_url: string;
    total_games: number;
    shareable_games: number;
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

    // Sum game demand points from games on this account
    let gameDemandPoints = 0;
    for (const g of games) {
      gameDemandPoints += g.gameScore;
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

  // Take TOP 10
  const top10 = rankedList.slice(0, 10).map((acc, index) => ({
    ...acc,
    rank: index + 1,
    score_percent: maxScore > 0 ? Math.round((acc.total_score / maxScore) * 100) : 100,
  }));

  // 7. Find top requested games overall
  const accountsNameMap = new Map(accounts.map((a) => [a.steam_id, a.persona_name]));
  const topGamesRequested: Top10ResultsData['topGamesRequested'] = [];

  const uniqueGamesRows = db.prepare(`
    SELECT app_id, name, header_image, price_formatted, reviews_global_percent
    FROM games
    WHERE is_family_shareable = 1
  `).all() as Array<{
    app_id: number;
    name: string;
    header_image: string;
    price_formatted: string;
    reviews_global_percent: number;
  }>;

  for (const g of uniqueGamesRows) {
    const gScore = gameScoreMap.get(g.app_id);
    if (gScore && gScore.requestedBy > 0) {
      const ownersSet = gameOwnersMap.get(g.app_id) || new Set();
      const ownerNames = Array.from(ownersSet).map((id) => accountsNameMap.get(id) || id);

      topGamesRequested.push({
        app_id: g.app_id,
        name: g.name,
        header_image: g.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${g.app_id}/header.jpg`,
        price_formatted: g.price_formatted || '',
        reviews_global_percent: g.reviews_global_percent || 0,
        requested_by_count: gScore.requestedBy,
        available_on_accounts: ownerNames,
      });
    }
  }

  topGamesRequested.sort((a, b) => b.requested_by_count - a.requested_by_count || b.reviews_global_percent - a.reviews_global_percent);

  const totalUniqueShareable = (db.prepare('SELECT COUNT(DISTINCT app_id) as c FROM games WHERE is_family_shareable = 1').get() as { c: number })?.c || 0;

  return {
    topAccounts: top10,
    totalVoters: totalVotersCount,
    totalSubmittedAccounts: accounts.length,
    totalUniqueShareableGames: totalUniqueShareable,
    topGamesRequested: topGamesRequested.slice(0, 20),
  };
}

// Backward compatibility helper
export function calculateOptimalFamily() {
  return calculateTop10Results();
}
