import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'steam-family-picker-secret-key-32-chars-minimum-needed!'
);

const STEAM_COOKIE_NAME = 'sfp_steam_session';
const ADMIN_COOKIE_NAME = 'sfp_admin_session';

export interface SteamUserSession {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

export async function createSteamSession(user: SteamUserSession) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);

  const isSecure = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false;

  const cookieStore = cookies();
  cookieStore.set(STEAM_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSteamSession(): Promise<SteamUserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(STEAM_COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      steamId: payload.steamId as string,
      personaName: payload.personaName as string,
      avatarUrl: payload.avatarUrl as string,
      profileUrl: payload.profileUrl as string,
    };
  } catch {
    return null;
  }
}

export async function clearSteamSession() {
  const cookieStore = cookies();
  cookieStore.delete(STEAM_COOKIE_NAME);
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  const isSecure = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false;

  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAdminSession(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function clearAdminSession() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
