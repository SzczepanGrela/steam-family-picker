import { NextResponse } from 'next/server';
import { clearSteamSession } from '@/lib/session';

export async function POST() {
  await clearSteamSession();
  return NextResponse.json({ success: true });
}
