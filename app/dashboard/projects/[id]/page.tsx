import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/services/project.service';
import { GbpSelector } from './gbp-selector';
import { ProjectProgress } from './project-progress';
import { DeleteProjectButton } from './delete-project-button';
import { getSiteUrl } from '@/lib/utils/site-url';
import type { ProjectStatus } from '@prisma/client';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  CREATED: 'Project Created',
  GBP_SELECTED: 'Business Selected',
  GBP_SCRAPED: 'Profile Scraped',
  WEBSITE_SCRAPED: 'Website Scraped',
  IMAGES_ANALYZED: 'Images Analyzed',
  HTML_GENERATED: 'Site Generated',
  READY: 'Ready',
};

export default async function ProjectDetailPage(props: ProjectDetailPageProps) {
  const params = await props.params;
  const { id } = params;

  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  // Server-rendered initial state
  const isProcessing = !['CREATED', 'HTML_GENERATED', 'READY'].includes(project.status);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard/projects"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Projects
            </Link>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.generatedHostname}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">{project.generatedHostname}</h1>
          <p className="text-gray-600">{STATUS_LABELS[project.status]}</p>
        </div>

        {/* GBP Selector - shown only when status is CREATED */}
        {project.status === 'CREATED' && (
          <div className="mb-6">
            <GbpSelector projectId={project.id} />
          </div>
        )}

        {/* Progress - shown when processing or completed */}
        {project.status !== 'CREATED' && (
          <ProjectProgress
            projectId={project.id}
            initialStatus={project.status}
            isPolling={isProcessing}
          />
        )}

        {/* Preview Link - shown when ready */}
        {(project.status === 'HTML_GENERATED' || project.status === 'READY') && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Preview Your Site</h2>
            <a
              href={getSiteUrl(project.generatedHostname)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              View Live Preview
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-sm text-gray-500 mt-2">
              {getSiteUrl(project.generatedHostname)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
