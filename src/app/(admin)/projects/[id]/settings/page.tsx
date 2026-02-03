import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/services/project.service';
import { ProjectSettingsClient } from './project-settings-client';

export const dynamic = 'force-dynamic';

interface ProjectSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return <ProjectSettingsClient project={project} />;
}
