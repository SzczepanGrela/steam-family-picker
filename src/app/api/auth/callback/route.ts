import { NextRequest, NextResponse } from 'next/server';
import { verifySteamOpenId, getPlayerSummary } from '@/lib/steam';
import { createSteamSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Extract base origin from openid.return_to, headers, or environment
  let baseOrigin = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!baseOrigin && params['openid.return_to']) {
    try {
      const u = new URL(params['openid.return_to']);
      baseOrigin = `${u.protocol}//${u.host}`;
    } catch {}
  }

  if (!baseOrigin) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '127.0.0.1:6767';
    const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
    baseOrigin = `${proto}://${host}`;
  }

  // Guarantee 0.0.0.0 is never used in client redirect
  if (baseOrigin.includes('0.0.0.0')) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (host && !host.includes('0.0.0.0')) {
      baseOrigin = baseOrigin.replace('0.0.0.0', host.split(':')[0]);
    }
  }

  const steamId = await verifySteamOpenId(params);

  if (!steamId) {
    return NextResponse.redirect(`${baseOrigin}/?error=auth_failed`);
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

  return NextResponse.redirect(`${baseOrigin}/`);
}
