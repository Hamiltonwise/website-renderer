import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/lib/services/project.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Return only the status-related fields
    return NextResponse.json({
      id: project.id,
      status: project.status,
      selectedPlaceId: project.selectedPlaceId,
      selectedWebsiteUrl: project.selectedWebsiteUrl,
      stepGbpScrape: project.stepGbpScrape,
      stepWebsiteScrape: project.stepWebsiteScrape,
      stepImageAnalysis: project.stepImageAnalysis,
      updatedAt: project.updatedAt,
    });
  } catch (error: any) {
    console.error('[API] Project status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
