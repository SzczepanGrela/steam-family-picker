import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Czteryzera0000';

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Nieprawidłowe hasło administratora' }, { status: 401 });
    }

    await createAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
