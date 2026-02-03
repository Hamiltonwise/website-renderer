import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/services/project.service';
import { getPublishedTemplates } from '@/lib/services/template.service';
import { ProjectDetailClient } from './project-detail-client';

export const dynamic = 'force-dynamic';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const [project, templates] = await Promise.all([
    getProjectById(id),
    getPublishedTemplates(), // Only show published templates for selection
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} templates={templates} />;
}
