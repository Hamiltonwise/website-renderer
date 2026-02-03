import { getProjectsByUserId } from '@/lib/services/project.service';
import type { Project, ProjectStatus } from '@/types';
import { ProjectsClient } from './projects-client';

// Disable static generation - this page needs database access
export const dynamic = 'force-dynamic';

// For MVP, we'll use a hardcoded user ID
// In production, this would come from authentication
const TEMP_USER_ID = 'temp-user-123';

export default async function ProjectsPage() {
  const projects = await getProjectsByUserId(TEMP_USER_ID);

  return <ProjectsClient projects={projects} />;
}
