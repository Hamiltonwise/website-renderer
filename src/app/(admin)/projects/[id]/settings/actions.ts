'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { deleteProject } from '@/lib/services/project.service';

export async function deleteProjectAction(projectId: string) {
  await deleteProject(projectId);
  revalidatePath('/projects');
  redirect('/projects');
}
