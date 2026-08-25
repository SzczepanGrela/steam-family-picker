import { NextResponse } from 'next/server';
import { db, getSystemPhase } from '@/lib/db';
import { getQueueStatus } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const phase = getSystemPhase();

  const accountsCount = (db.prepare('SELECT COUNT(*) as count FROM accounts WHERE is_submitted = 1').get() as { count: number })?.count || 0;
  const gamesCount = (db.prepare('SELECT COUNT(DISTINCT app_id) as count FROM games WHERE is_family_shareable = 1').get() as { count: number })?.count || 0;
  const totalRegisteredGames = (db.prepare('SELECT COUNT(*) as count FROM games').get() as { count: number })?.count || 0;
  const votersCount = (db.prepare('SELECT COUNT(DISTINCT voter_steam_id) as count FROM user_preferences').get() as { count: number })?.count || 0;

  const queueStatus = getQueueStatus();

  return NextResponse.json({
    phase,
    accountsCount,
    gamesCount,
    totalRegisteredGames,
    votersCount,
    queueStatus,
  });
}
