import { db } from './db';

export interface AccountInfo {
  steam_id: string;
  persona_name: string;
  avatar_url: string;
  profile_url: string;
  total_games: number;
  shareable_games: number;
}

export interface VoterWishlist {
  voter_steam_id: string;
  voter_name?: string;
  voter_avatar?: string;
  items: Map<number, number>; // appId -> score (3 for must-play, 1 for interested)
  totalPotentialScore: number;
}

export interface OptimizationResult {
  winningAccounts: Array<AccountInfo & { uniqueGamesContributed: number }>;
  offlineAccounts: AccountInfo[];
  totalFamilyGamesCount: number;
  totalGroupScore: number;
  averageSatisfactionPercent: number;
  voterBreakdowns: Array<{
    voter_steam_id: string;
    voter_name: string;
    voter_avatar: string;
    satisfactionPercent: number;
    satisfiedScore: number;
    totalScore: number;
    satisfiedGames: Array<{ app_id: number; name: string; header_image: string; score: number; providedBy: string }>;
    missingGames: Array<{ app_id: number; name: string; header_image: string; score: number; availableOnOfflineAccount?: string }>;
  }>;
  offlineVaultGames: Array<{
    app_id: number;
    name: string;
    header_image: string;
    requestedByCount: number;
    ownedByAccount: string;
  }>;
}

function getCombinations<T>(array: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (array.length < size) return [];
  const [head, ...tail] = array;
  const withHead = getCombinations(tail, size - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, size);
  return [...withHead, ...withoutHead];
}

export function calculateOptimalFamily(): OptimizationResult | null {
  // 1. Fetch all submitted accounts with their shareable games
  const accounts = db.prepare(`
    SELECT steam_id, persona_name, avatar_url, profile_url, total_games, shareable_games
    FROM accounts
    WHERE is_submitted = 1
  `).all() as AccountInfo[];

  if (accounts.length === 0) {
    return null;
  }

  // 2. Fetch games owned by each account (only shareable ones)
  const accountGamesMap = new Map<string, Set<number>>();
  const gameDetailsMap = new Map<number, { app_id: number; name: string; header_image: string }>();

  const allGames = db.prepare(`
    SELECT ag.steam_id, ag.app_id, g.name, g.header_image
    FROM account_games ag
    JOIN games g ON ag.app_id = g.app_id
    WHERE g.is_family_shareable = 1
  `).all() as Array<{ steam_id: string; app_id: number; name: string; header_image: string }>;

  for (const row of allGames) {
    if (!accountGamesMap.has(row.steam_id)) {
      accountGamesMap.set(row.steam_id, new Set<number>());
    }
    accountGamesMap.get(row.steam_id)!.add(row.app_id);

    if (!gameDetailsMap.has(row.app_id)) {
      gameDetailsMap.set(row.app_id, {
        app_id: row.app_id,
        name: row.name,
        header_image: row.header_image,
      });
    }
  }

  // 3. Fetch voter preferences and voter profile info
  const voterPrefs = db.prepare(`
    SELECT 
      up.voter_steam_id, 
      up.app_id, 
      up.score,
      COALESCE(a.persona_name, 'Anonimowy Gracz') as persona_name,
      COALESCE(a.avatar_url, '') as avatar_url
    FROM user_preferences up
    LEFT JOIN accounts a ON up.voter_steam_id = a.steam_id
    JOIN games g ON up.app_id = g.app_id
    WHERE g.is_family_shareable = 1
  `).all() as Array<{ voter_steam_id: string; app_id: number; score: number; persona_name: string; avatar_url: string }>;

  const votersMap = new Map<string, VoterWishlist>();
  for (const row of voterPrefs) {
    if (!votersMap.has(row.voter_steam_id)) {
      votersMap.set(row.voter_steam_id, {
        voter_steam_id: row.voter_steam_id,
        voter_name: row.persona_name,
        voter_avatar: row.avatar_url,
        items: new Map<number, number>(),
        totalPotentialScore: 0,
      });
    }
    const voter = votersMap.get(row.voter_steam_id)!;
    voter.items.set(row.app_id, row.score);
    voter.totalPotentialScore += row.score;
  }

  // Target size is 4, or all accounts if total accounts <= 4
  const targetSize = Math.min(4, accounts.length);
  const allCombos = getCombinations(accounts, targetSize);

  let bestCombination: AccountInfo[] = accounts.slice(0, targetSize);
  let bestScore = -1;
  let bestFairness = -1;

  for (const combo of allCombos) {
    // Collect all unique games in this combo
    const comboGames = new Set<number>();
    for (const acc of combo) {
      const gSet = accountGamesMap.get(acc.steam_id);
      if (gSet) {
        for (const appId of gSet) {
          comboGames.add(appId);
        }
      }
    }

    let totalScore = 0;
    let minSatisfactionRatio = 1.0;

    for (const voter of votersMap.values()) {
      let voterScore = 0;
      for (const [appId, weight] of voter.items.entries()) {
        if (comboGames.has(appId)) {
          voterScore += weight;
        }
      }
      totalScore += voterScore;
      const ratio = voter.totalPotentialScore > 0 ? voterScore / voter.totalPotentialScore : 1.0;
      if (ratio < minSatisfactionRatio) {
        minSatisfactionRatio = ratio;
      }
    }

    // Objective function: Maximize total group score + fairness boost
    const comboFitness = totalScore + minSatisfactionRatio * 50;

    if (comboFitness > bestScore || (comboFitness === bestScore && minSatisfactionRatio > bestFairness)) {
      bestScore = comboFitness;
      bestFairness = minSatisfactionRatio;
      bestCombination = combo;
    }
  }

  // Calculate detailed stats for the winning combination
  const winningSteamIds = new Set(bestCombination.map((a) => a.steam_id));
  const offlineAccounts = accounts.filter((a) => !winningSteamIds.has(a.steam_id));

  const winningGamesSet = new Set<number>();
  for (const acc of bestCombination) {
    const gSet = accountGamesMap.get(acc.steam_id);
    if (gSet) {
      for (const appId of gSet) {
        winningGamesSet.add(appId);
      }
    }
  }

  // Calculate unique games contributed by each winning account
  const winningAccountsWithStats = bestCombination.map((acc) => {
    const myGames = accountGamesMap.get(acc.steam_id) || new Set<number>();
    let uniqueCount = 0;
    for (const appId of myGames) {
      // Check if any other winning account has this game
      let hasOther = false;
      for (const other of bestCombination) {
        if (other.steam_id !== acc.steam_id && accountGamesMap.get(other.steam_id)?.has(appId)) {
          hasOther = true;
          break;
        }
      }
      if (!hasOther) {
        uniqueCount++;
      }
    }
    return {
      ...acc,
      uniqueGamesContributed: uniqueCount,
    };
  });

  // Calculate voter breakdowns
  let totalGroupSatisfiedScore = 0;
  let totalPotentialSum = 0;

  const voterBreakdowns = Array.from(votersMap.values()).map((voter) => {
    const satisfiedGames: Array<{ app_id: number; name: string; header_image: string; score: number; providedBy: string }> = [];
    const missingGames: Array<{ app_id: number; name: string; header_image: string; score: number; availableOnOfflineAccount?: string }> = [];
    let satisfiedScore = 0;

    for (const [appId, score] of voter.items.entries()) {
      const gDetail = gameDetailsMap.get(appId) || { app_id: appId, name: `Nieznana gra (${appId})`, header_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg` };

      if (winningGamesSet.has(appId)) {
        satisfiedScore += score;
        // Find which winning account provides it
        const provider = bestCombination.find((a) => accountGamesMap.get(a.steam_id)?.has(appId));
        satisfiedGames.push({
          app_id: appId,
          name: gDetail.name,
          header_image: gDetail.header_image,
          score,
          providedBy: provider?.persona_name || 'Rodzina Steam',
        });
      } else {
        // Check if available on any offline account
        const offlineProvider = offlineAccounts.find((a) => accountGamesMap.get(a.steam_id)?.has(appId));
        missingGames.push({
          app_id: appId,
          name: gDetail.name,
          header_image: gDetail.header_image,
          score,
          availableOnOfflineAccount: offlineProvider?.persona_name,
        });
      }
    }

    totalGroupSatisfiedScore += satisfiedScore;
    totalPotentialSum += voter.totalPotentialScore;

    const satisfactionPercent = voter.totalPotentialScore > 0 
      ? Math.round((satisfiedScore / voter.totalPotentialScore) * 100) 
      : 100;

    return {
      voter_steam_id: voter.voter_steam_id,
      voter_name: voter.voter_name || 'Anonimowy Gracz',
      voter_avatar: voter.voter_avatar || '',
      satisfactionPercent,
      satisfiedScore,
      totalScore: voter.totalPotentialScore,
      satisfiedGames,
      missingGames,
    };
  });

  const averageSatisfactionPercent = totalPotentialSum > 0 
    ? Math.round((totalGroupSatisfiedScore / totalPotentialSum) * 100) 
    : 100;

  // Find Offline Vault Games (wanted games that are only on offline accounts)
  const offlineVaultMap = new Map<number, { app_id: number; name: string; header_image: string; count: number; owner: string }>();
  for (const vb of voterBreakdowns) {
    for (const mg of vb.missingGames) {
      if (mg.availableOnOfflineAccount) {
        if (!offlineVaultMap.has(mg.app_id)) {
          offlineVaultMap.set(mg.app_id, {
            app_id: mg.app_id,
            name: mg.name,
            header_image: mg.header_image,
            count: 0,
            owner: mg.availableOnOfflineAccount,
          });
        }
        offlineVaultMap.get(mg.app_id)!.count++;
      }
    }
  }

  const offlineVaultGames = Array.from(offlineVaultMap.values()).map((item) => ({
    app_id: item.app_id,
    name: item.name,
    header_image: item.header_image,
    requestedByCount: item.count,
    ownedByAccount: item.owner,
  })).sort((a, b) => b.requestedByCount - a.requestedByCount);

  return {
    winningAccounts: winningAccountsWithStats,
    offlineAccounts,
    totalFamilyGamesCount: winningGamesSet.size,
    totalGroupScore: totalGroupSatisfiedScore,
    averageSatisfactionPercent,
    voterBreakdowns,
    offlineVaultGames,
  };
}
