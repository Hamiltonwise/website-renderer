import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, deleteProject, updateProject } from '@/lib/services/project.service';

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

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch project';
    console.error('[API] Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = await deleteProject(id);

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete project';
    console.error('[API] Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const project = await updateProject(id, body);

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    console.error('[API] Error updating project:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
