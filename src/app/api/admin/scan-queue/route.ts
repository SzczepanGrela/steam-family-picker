import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { getQueueStatus, startQueueWorker } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getQueueStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  startQueueWorker();
  const status = getQueueStatus();
  return NextResponse.json({ success: true, status });
}
