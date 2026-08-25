import { NextRequest, NextResponse } from 'next/server';
import { verifySteamOpenId, getPlayerSummary } from '@/lib/steam';
import { createSteamSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const steamId = await verifySteamOpenId(params);

  if (!steamId) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  const player = await getPlayerSummary(steamId);
  const personaName = player?.personaname || `SteamUser_${steamId.slice(-4)}`;
  const avatarUrl = player?.avatarfull || player?.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
  const profileUrl = player?.profileurl || `https://steamcommunity.com/profiles/${steamId}`;

  await createSteamSession({
    steamId,
    personaName,
    avatarUrl,
    profileUrl,
  });

  return NextResponse.redirect(new URL('/', request.url));
}
