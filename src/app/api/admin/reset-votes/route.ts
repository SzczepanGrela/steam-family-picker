import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import { db, setSystemPhase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { switchToVoting = true } = body as { switchToVoting?: boolean };

    db.exec('BEGIN TRANSACTION;');
    try {
      // Clear all voting data
      db.exec(`
        DELETE FROM ballot_submissions;
        DELETE FROM account_preferences;
        DELETE FROM user_preferences;
        DELETE FROM user_wishlists;
      `);

      // Optionally switch phase back to 'voting'
      if (switchToVoting) {
        setSystemPhase('voting');
      }

      db.exec('COMMIT;');

      return NextResponse.json({
        success: true,
        message: 'Pomyślnie zresetowano wszystkie głosy, zaznaczone gry i ułożone rankingi. Głosowanie zostało otwarte na nowo.',
      });
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }
  } catch (error) {
    console.error('Error resetting votes:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas resetowania głosów' }, { status: 500 });
  }
}
