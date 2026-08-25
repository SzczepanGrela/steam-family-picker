import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/session';

// In-memory rate limiter for admin login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return false;
  }

  record.count++;
  record.lastAttempt = now;

  if (record.count > MAX_ATTEMPTS) {
    return true;
  }

  return false;
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    const record = loginAttempts.get(ip);
    const waitSeconds = record ? Math.ceil((WINDOW_MS - (Date.now() - record.lastAttempt)) / 1000) : 300;
    return NextResponse.json(
      { error: `Zbyt wiele prób logowania. Spróbuj ponownie za ${Math.ceil(waitSeconds / 60)} min.` },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Czteryzera0000';

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Nieprawidłowe hasło administratora' }, { status: 401 });
    }

    // Success — clear rate limit for this IP
    clearRateLimit(ip);
    await createAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
