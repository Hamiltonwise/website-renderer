import { NextRequest, NextResponse } from 'next/server';
import { createProject, getProjectsByUserId } from '@/lib/services/project.service';

// TODO: Replace with actual auth
const TEMP_USER_ID = 'temp-user-123';

export async function GET() {
  try {
    const projects = await getProjectsByUserId(TEMP_USER_ID);
    return NextResponse.json({ success: true, data: projects });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects';
    console.error('[API] Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostname } = body;

    const project = await createProject(TEMP_USER_ID, hostname);
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    console.error('[API] Error creating project:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
