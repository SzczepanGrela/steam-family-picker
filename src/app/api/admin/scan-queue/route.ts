import { NextResponse } from 'next/server';
import { getQueueStatus, startQueueWorker } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getQueueStatus();
  return NextResponse.json(status);
}

export async function POST() {
  startQueueWorker();
  const status = getQueueStatus();
  return NextResponse.json({ success: true, status });
}
