'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createProject } from '@/lib/services/project.service';

/**
 * Server action to create a new project
 */
export async function createNewProject(userId: string) {
  // Create project with auto-generated hostname
  const project = await createProject(userId);

  console.log('[Action] Created new project:', project.id, project.generated_hostname);

  // Revalidate the projects list
  revalidatePath('/dashboard/projects');

  // Redirect to the new project page
  redirect(`/dashboard/projects/${project.id}`);
}
