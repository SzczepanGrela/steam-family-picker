import { NextRequest, NextResponse } from 'next/server';
import { getSteamLoginUrl } from '@/lib/steam';

export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '127.0.0.1:6767';
  const protoHeader = request.headers.get('x-forwarded-proto');
  const isHttps = protoHeader === 'https' || (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') && !host.includes('localhost') && !host.startsWith('192.168.') && !host.startsWith('127.'));
  const protocol = isHttps ? 'https' : 'http';
  
  const baseUrl = `${protocol}://${host}`;

  const returnUrl = `${baseUrl}/api/auth/callback`;
  const realm = `${protocol}://${host}`;

  const loginUrl = getSteamLoginUrl(returnUrl, realm);
  return NextResponse.redirect(loginUrl);
}
