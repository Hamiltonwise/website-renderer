import Link from 'next/link';
import { getProjectsByUserId } from '@/lib/services/project.service';
import { CreateProjectButton } from './create-project-button';
import type { ProjectStatus } from '@/types';

// Disable static generation - this page needs database access
export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  CREATED: 'Project Created',
  GBP_SELECTED: 'Business Selected',
  GBP_SCRAPED: 'Profile Scraped',
  WEBSITE_SCRAPED: 'Website Scraped',
  IMAGES_ANALYZED: 'Images Analyzed',
  HTML_GENERATED: 'Site Generated',
  READY: 'Ready',
};

const STATUS_PROGRESS: Record<ProjectStatus, number> = {
  CREATED: 0,
  GBP_SELECTED: 15,
  GBP_SCRAPED: 30,
  WEBSITE_SCRAPED: 50,
  IMAGES_ANALYZED: 70,
  HTML_GENERATED: 90,
  READY: 100,
};

export default async function ProjectsListPage() {
  // For MVP, we'll use a hardcoded user ID
  // In production, this would come from authentication
  const userId = 'test-user-1';

  const projects = await getProjectsByUserId(userId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Projects</h1>
          <div className="flex gap-4 items-center">
            <CreateProjectButton />
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <p className="text-sm text-gray-400">
              Create a project to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      {project.generated_hostname}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {STATUS_LABELS[project.status]}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'READY'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{STATUS_PROGRESS[project.status]}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${STATUS_PROGRESS[project.status]}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
