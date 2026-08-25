import { NextResponse } from 'next/server';
import { getSteamSession, getAdminSession } from '@/lib/session';
import { getSystemPhase, db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSteamSession();
  const isAdmin = await getAdminSession();
  const phase = getSystemPhase();

  let isSubmitted = false;
  let accountInfo = null;

  if (session) {
    const acc = db.prepare(`
      SELECT steam_id, persona_name, avatar_url, is_public, is_submitted, total_games, shareable_games, scan_status 
      FROM accounts 
      WHERE steam_id = ?
    `).get(session.steamId);

    if (acc) {
      isSubmitted = true;
      accountInfo = acc;
    }
  }

  return NextResponse.json({
    user: session,
    isAdmin,
    phase,
    isSubmitted,
    accountInfo,
  });
}
