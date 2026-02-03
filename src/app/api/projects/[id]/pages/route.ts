import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/lib/services/project.service';
import { createPageVersion, publishPage, getPageToRender } from '@/lib/services/page.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/pages?path=/
 * Get a page for a project by path
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const page = await getPageToRender(id, path);
    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: page });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch page';
    console.error('[API] Error fetching page:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/pages
 * Create a new page for a project (used by n8n to save generated HTML)
 *
 * Body:
 * {
 *   "path": "/",
 *   "htmlContent": "<html>...</html>",
 *   "publish": true  // optional, default false
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { path = '/', htmlContent, publish = false } = body;

    if (!htmlContent) {
      return NextResponse.json(
        { success: false, error: 'htmlContent is required' },
        { status: 400 }
      );
    }

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create the page version
    const page = await createPageVersion(id, path, htmlContent);

    // Optionally publish immediately
    if (publish) {
      const publishedPage = await publishPage(page.id);
      return NextResponse.json({
        success: true,
        data: publishedPage,
        message: 'Page created and published',
      });
    }

    return NextResponse.json({
      success: true,
      data: page,
      message: 'Page created as draft',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create page';
    console.error('[API] Error creating page:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
