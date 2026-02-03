import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/services/gbp.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Input is required' },
        { status: 400 }
      );
    }

    const result = await searchPlaces(input);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to search places';
    console.error('[API] Error searching places:', error);
    return NextResponse.json(
      { success: false, error: message, suggestions: [] },
      { status: 500 }
    );
  }
}
