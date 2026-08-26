export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  communityvisibilitystate: number;
}

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  has_community_visible_stats?: boolean;
}

export interface AppDetails {
  appId: number;
  name: string;
  headerImage: string;
  isFamilyShareable: boolean;
  genres: string[];
  categories: string[];
  priceFinal: number;
  priceFormatted: string;
  reviewsGlobalPercent: number;
  reviewsGlobalCount: number;
  reviewsGlobalDesc: string;
  reviewsPolishPercent: number;
  reviewsPolishCount: number;
  reviewsPolishDesc: string;
}

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

export function getSteamLoginUrl(returnUrl: string, realm: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamOpenId(params: Record<string, string>): Promise<string | null> {
  try {
    const validationParams = new URLSearchParams(params);
    validationParams.set('openid.mode', 'check_authentication');

    const res = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: validationParams.toString(),
    });

    const text = await res.text();
    if (text.includes('is_valid:true')) {
      const claimedId = params['openid.claimed_id'] || '';
      const match = claimedId.match(/\/id\/(\d+)$/);
      return match ? match[1] : null;
    }

    return null;
  } catch (error) {
    console.error('Steam OpenID verification error:', error);
    return null;
  }
}

export async function resolveSteamId(input: string): Promise<string | null> {
  const trimmed = input.trim();
  const apiKey = process.env.STEAM_API_KEY;

  if (/^\d{17}$/.test(trimmed)) {
    return trimmed;
  }

  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return profileMatch[1];
  }

  const customMatch = trimmed.match(/steamcommunity\.com\/id\/([^/?#]+)/);
  const vanity = customMatch ? customMatch[1] : trimmed;

  if (apiKey) {
    try {
      const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${encodeURIComponent(vanity)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.response?.success === 1) {
        return data.response.steamid;
      }
    } catch (e) {
      console.error('Error resolving vanity url:', e);
    }
  }

  return null;
}

export async function getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
    const res = await fetch(url);
    const data = await res.json();
    const players = data?.response?.players;
    if (players && players.length > 0) {
      return players[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting player summary:', error);
    return null;
  }
}

export async function getOwnedGames(steamId: string): Promise<{ games: SteamOwnedGame[]; isPublic: boolean }> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return { games: [], isPublic: false };

  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=0&format=json`;
    const res = await fetch(url);
    const data = await res.json();

    if (data?.response && 'games' in data.response) {
      return {
        games: data.response.games || [],
        isPublic: true,
      };
    }

    return {
      games: [],
      isPublic: false,
    };
  } catch (error) {
    console.error('Error getting owned games:', error);
    return { games: [], isPublic: false };
  }
}

async function fetchAppReviewsSummary(appId: number, language: string): Promise<{
  percent: number;
  count: number;
  desc: string;
}> {
  try {
    const url = `https://store.steampowered.com/appreviews/${appId}?json=1&language=${language}&purchase_type=all`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SteamFamilyPicker/1.0',
      },
    });

    if (!res.ok) {
      return { percent: 0, count: 0, desc: '' };
    }

    const data = await res.json();
    const qs = data?.query_summary;
    if (!qs) {
      return { percent: 0, count: 0, desc: '' };
    }

    const total = qs.total_reviews || 0;
    const positive = qs.total_positive || 0;
    const percent = total > 0 ? Math.round((positive / total) * 100) : 0;
    const desc = qs.review_score_desc || '';

    return { percent, count: total, desc };
  } catch {
    return { percent: 0, count: 0, desc: '' };
  }
}

export async function fetchAppDetails(appId: number): Promise<AppDetails | null> {
  try {
    // Request app details in Polish to get Polish descriptions and PLN pricing
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=pl&l=polish`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SteamFamilyPicker/1.0',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
      },
    });

    if (res.status === 429) {
      console.warn(`Steam Store API rate limit reached (HTTP 429) on app ${appId}`);
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const appData = data?.[appId];

    if (!appData || !appData.success || !appData.data) {
      return {
        appId,
        name: '',
        headerImage: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
        isFamilyShareable: false,
        genres: [],
        categories: [],
        priceFinal: 0,
        priceFormatted: '',
        reviewsGlobalPercent: 0,
        reviewsGlobalCount: 0,
        reviewsGlobalDesc: '',
        reviewsPolishPercent: 0,
        reviewsPolishCount: 0,
        reviewsPolishDesc: '',
      };
    }

    const details = appData.data;
    const categories: Array<{ id: number; description: string }> = details.categories || [];
    const genres: Array<{ id: string; description: string }> = details.genres || [];
    const name = details.name || '';
    const type = details.type || 'game';

    // Filter out test servers, public betas, playtests, dedicated servers, soundtracks, tools, demos
    const isJunkOrTest = type !== 'game' 
      || /\b(test server|public test|beta|playtest|dedicated server|benchmark|soundtrack|ost|sdk|server)\b/i.test(name)
      || /\bdemo\b/i.test(name);

    // Free-to-play check
    const isF2P = details.is_free === true 
      || genres.some((g) => g.description.toLowerCase().includes('free to play') || g.description.toLowerCase().includes('free-to-play'));

    // Steam Category 62 is "Family Sharing". Free-to-play and test servers/betas are excluded.
    const isFamilyShareable = !isJunkOrTest && !isF2P && categories.some((cat) => cat.id === 62);

    // Pricing
    let priceFinal = 0;
    let priceFormatted = details.is_free ? 'Darmowa' : '';
    if (details.price_overview) {
      priceFinal = details.price_overview.final || 0;
      priceFormatted = details.price_overview.final_formatted || `${(priceFinal / 100).toFixed(2)} zł`;
    }

    // Fetch Reviews (Global & Polish concurrently)
    const [globalReviews, polishReviews] = await Promise.all([
      fetchAppReviewsSummary(appId, 'all'),
      fetchAppReviewsSummary(appId, 'polish'),
    ]);

    return {
      appId,
      name,
      headerImage: details.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      isFamilyShareable,
      genres: genres.map((g) => g.description),
      categories: categories.map((c) => c.description),
      priceFinal,
      priceFormatted,
      reviewsGlobalPercent: globalReviews.percent,
      reviewsGlobalCount: globalReviews.count,
      reviewsGlobalDesc: globalReviews.desc,
      reviewsPolishPercent: polishReviews.percent,
      reviewsPolishCount: polishReviews.count,
      reviewsPolishDesc: polishReviews.desc,
    };
  } catch (error) {
    console.error(`Error fetching app details for ${appId}:`, error);
    return null;
  }
}

export async function getSteamWishlist(steamId: string): Promise<number[]> {
  const apiKey = process.env.STEAM_API_KEY;

  // 1. Try official Steam IWishlistService Web API first (fast & reliable)
  if (apiKey) {
    try {
      const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${apiKey}&steamid=${steamId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data?.response?.items;
        if (Array.isArray(items) && items.length > 0) {
          return items.map((i: { appid: number }) => i.appid).filter((id: number) => typeof id === 'number' && id > 0);
        }
      }
    } catch (error) {
      console.error('Error fetching from IWishlistService:', error);
    }
  }

  // 2. Fallback to store wishlist_data.json
  try {
    const url = `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlist_data.json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        return Object.keys(data).map(Number).filter((id) => !isNaN(id) && id > 0);
      }
    }
  } catch (error) {
    console.error('Error fetching from wishlist_data.json:', error);
  }

  return [];
}
