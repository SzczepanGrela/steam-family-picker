import { NextRequest, NextResponse } from 'next/server';
import { getSteamLoginUrl } from '@/lib/steam';

export async function GET(request: NextRequest) {
  let host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  
  if (!host || host.includes('0.0.0.0')) {
    try {
      const u = new URL(request.url);
      if (u.host && !u.host.includes('0.0.0.0')) {
        host = u.host;
      }
    } catch {}
  }
  
  if (!host || host.includes('0.0.0.0')) {
    host = '127.0.0.1:6767';
  }

  const protoHeader = request.headers.get('x-forwarded-proto');
  const isHttps = protoHeader === 'https' || (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') && !host.includes('localhost') && !host.startsWith('192.168.') && !host.startsWith('127.') && !host.startsWith('31.'));
  const protocol = isHttps ? 'https' : 'http';
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '';
  const returnUrl = returnTo 
    ? `${baseUrl}/api/auth/callback?returnTo=${encodeURIComponent(returnTo)}` 
    : `${baseUrl}/api/auth/callback`;
  const realm = baseUrl;

  const loginUrl = getSteamLoginUrl(returnUrl, realm);
  return NextResponse.redirect(loginUrl);
}
