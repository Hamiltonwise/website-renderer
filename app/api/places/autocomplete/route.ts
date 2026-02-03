import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/services/gbp.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Input is required', suggestions: [] },
        { status: 400 }
      );
    }

    const result = await searchPlaces(input);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Places autocomplete error:', error);
    return NextResponse.json(
      { success: false, error: error.message, suggestions: [] },
      { status: 500 }
    );
  }
}
