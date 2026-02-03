import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/lib/services/project.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Return only status-relevant fields for polling
    return NextResponse.json({
      id: project.id,
      status: project.status,
      selected_place_id: project.selected_place_id,
      selected_website_url: project.selected_website_url,
      step_gbp_scrape: project.step_gbp_scrape,
      step_website_scrape: project.step_website_scrape,
      step_image_analysis: project.step_image_analysis,
      updated_at: project.updated_at,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch project status';
    console.error('[API] Error fetching project status:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
