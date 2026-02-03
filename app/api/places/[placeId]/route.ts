import { NextRequest, NextResponse } from 'next/server';
import { getPlaceDetails } from '@/lib/services/gbp.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;

    if (!placeId) {
      return NextResponse.json(
        { success: false, error: 'Place ID is required' },
        { status: 400 }
      );
    }

    const result = await getPlaceDetails(placeId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Place details error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
