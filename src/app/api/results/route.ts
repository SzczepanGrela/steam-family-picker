import { NextResponse } from 'next/server';
import { calculateOptimalFamily } from '@/lib/optimizer';
import { getSystemPhase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const phase = getSystemPhase();

  // If results are ready or user requests preview
  const result = calculateOptimalFamily();

  if (!result) {
    return NextResponse.json({
      phase,
      hasResult: false,
      message: 'Brak zgłoszonych kont lub gier do obliczeń.',
    });
  }

  return NextResponse.json({
    phase,
    hasResult: true,
    result,
  });
}
