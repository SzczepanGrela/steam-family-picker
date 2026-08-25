const STEAM_API_KEY = process.env.STEAM_API_KEY || '66923F00F7B686C296C1160B4FC0A8FA';
const OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  communityvisibilitystate: number; // 3 = public
}

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
}

export interface AppDetailsResult {
  appId: number;
  name: string;
  headerImage: string;
  isFamilyShareable: boolean;
  genres: string[];
  categories: string[];
}

export function getSteamLoginUrl(returnUrl: string, realm: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `${OPENID_ENDPOINT}?${params.toString()}`;
}

export async function verifySteamOpenId(params: Record<string, string>): Promise<string | null> {
  try {
    const verifyParams = new URLSearchParams(params);
    verifyParams.set('openid.mode', 'check_authentication');

    const response = await fetch(OPENID_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    });

    const text = await response.text();
    if (!text.includes('is_valid:true')) {
      return null;
    }

    const claimedId = params['openid.claimed_id'];
    if (!claimedId) return null;

    const match = claimedId.match(/https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error verifying Steam OpenID:', error);
    return null;
  }
}

export async function resolveSteamId(input: string): Promise<string | null> {
  const trimmed = input.trim();
  
  // Directly a 17-digit SteamID64
  if (/^\d{17}$/.test(trimmed)) {
    return trimmed;
  }

  // Profile URL with /profiles/12345678901234567
  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return profileMatch[1];
  }

  // Vanity URL with /id/custom_name
  const idMatch = trimmed.match(/steamcommunity\.com\/id\/([^/?#]+)/);
  const vanityName = idMatch ? idMatch[1] : trimmed;

  try {
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${encodeURIComponent(vanityName)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.response?.success === 1 && data.response.steamid) {
      return data.response.steamid;
    }
  } catch (error) {
    console.error('Failed to resolve vanity URL:', error);
  }

  return null;
}

export async function getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    const players = data?.response?.players;
    if (players && players.length > 0) {
      return players[0];
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch player summary:', error);
    return null;
  }
}

export async function getOwnedGames(steamId: string): Promise<{ games: SteamOwnedGame[]; isPublic: boolean }> {
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=0&format=json`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!data?.response || Object.keys(data.response).length === 0) {
      return { games: [], isPublic: false };
    }

    const games: SteamOwnedGame[] = data.response.games || [];
    return { games, isPublic: true };
  } catch (error) {
    console.error('Failed to fetch owned games:', error);
    return { games: [], isPublic: false };
  }
}

export async function fetchAppDetails(appId: number): Promise<AppDetailsResult | null> {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SteamFamilyPicker/1.0',
        'Accept-Language': 'en-US,en;q=0.9',
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
      };
    }

    const details = appData.data;
    const categories: Array<{ id: number; description: string }> = details.categories || [];
    const genres: Array<{ id: string; description: string }> = details.genres || [];

    // Steam Category 62 is "Family Sharing". Free-to-play games are excluded since anyone can play them for free.
    const isFamilyShareable = !details.is_free && categories.some((cat) => cat.id === 62);

    return {
      appId,
      name: details.name || '',
      headerImage: details.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      isFamilyShareable,
      genres: genres.map((g) => g.description),
      categories: categories.map((c) => c.description),
    };
  } catch (error) {
    console.error(`Error fetching app details for ${appId}:`, error);
    return null;
  }
}

export async function getSteamWishlist(steamId: string): Promise<number[]> {
  try {
    const url = `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlist_data.json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SteamFamilyPicker/1.0',
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') return [];

    const appIds = Object.keys(data)
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    return appIds;
  } catch (error) {
    console.error(`Failed to fetch wishlist for ${steamId}:`, error);
    return [];
  }
}
