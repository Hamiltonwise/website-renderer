import { NextRequest, NextResponse } from 'next/server';
import { getPlaceDetails } from '@/lib/services/gbp.service';

interface RouteParams {
  params: Promise<{ placeId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch place details';
    console.error('[API] Error fetching place details:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
