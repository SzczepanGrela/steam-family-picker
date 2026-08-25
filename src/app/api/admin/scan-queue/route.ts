import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { 
  getQueueStatus, 
  resumeQueueWorker, 
  pauseQueueWorker, 
  restartQueueFromScratch 
} from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getQueueStatus();
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'resume';

    if (action === 'pause') {
      pauseQueueWorker();
    } else if (action === 'restart') {
      restartQueueFromScratch();
    } else {
      // default: resume/start
      resumeQueueWorker();
    }

    const status = getQueueStatus();
    return NextResponse.json({ success: true, action, status });
  } catch (error) {
    console.error('Error managing scan queue:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
