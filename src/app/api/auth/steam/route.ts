import { NextRequest, NextResponse } from 'next/server';
import { getSteamLoginUrl } from '@/lib/steam';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const returnUrl = `${baseUrl}/api/auth/callback`;
  const realm = baseUrl;

  const loginUrl = getSteamLoginUrl(returnUrl, realm);
  return NextResponse.redirect(loginUrl);
}
