'use client';

import { motion } from 'framer-motion';
import {
  FolderKanban,
  Search,
  MoreVertical,
  Globe,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Project, ProjectStatus } from '@/types';
import { CreateProjectButton } from './create-project-button';
import { getSiteUrl } from '@/lib/utils/site-url';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType; progress: number }
> = {
  CREATED: {
    label: 'Project Created',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Clock,
    progress: 0,
  },
  GBP_SELECTED: {
    label: 'Business Selected',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Clock,
    progress: 15,
  },
  GBP_SCRAPED: {
    label: 'Profile Scraped',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Loader2,
    progress: 30,
  },
  WEBSITE_SCRAPED: {
    label: 'Website Scraped',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Loader2,
    progress: 50,
  },
  IMAGES_ANALYZED: {
    label: 'Images Analyzed',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: Loader2,
    progress: 70,
  },
  HTML_GENERATED: {
    label: 'Site Generated',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: CheckCircle2,
    progress: 90,
  },
  READY: {
    label: 'Ready',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    progress: 100,
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      type: 'spring' as const,
      stiffness: 100,
    },
  }),
};

interface ProjectsClientProps {
  projects: Project[];
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(
    (project) =>
      project.generated_hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 font-light">Manage your website projects</p>
            </div>
          </div>
          <CreateProjectButton />
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none font-medium placeholder:text-gray-400"
          />
        </motion.div>

        {filteredProjects.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 font-light mb-6 max-w-md mx-auto">
              Create your first project to start building beautiful websites with AI.
            </p>
            <CreateProjectButton />
          </motion.div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => {
              const status = STATUS_CONFIG[project.status];
              const StatusIcon = status.icon;

              const isReady = project.status === 'READY';

              return (
                <motion.div
                  key={project.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className={`rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer flex flex-col ${
                    isReady
                      ? 'bg-gradient-to-br from-white via-white to-green-50 border border-gray-100 hover:border-brand-100'
                      : 'bg-gradient-to-br from-white via-white to-orange-50 border border-gray-100 hover:border-brand-100'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {project.generated_hostname}
                    </h3>
                    <p className="text-sm text-gray-500 font-light">
                      Created {formatDate(project.created_at)}
                    </p>
                  </div>

                  {/* Progress Bar - hidden when ready */}
                  {!isReady && (
                    <div className="px-6 pb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>{status.label}</span>
                        <span>{status.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                          style={{ width: `${status.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="px-6 pb-4">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor}`}
                    >
                      <StatusIcon
                        className={`w-4 h-4 ${status.color} ${
                          status.icon === Loader2 ? 'animate-spin' : ''
                        }`}
                      />
                      <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-auto px-6 py-4 bg-white/60 backdrop-blur-sm border-t border-gray-100/50 flex items-center justify-between">
                    <span className="text-brand-600 font-medium text-sm">
                      View Details
                    </span>
                    {isReady && (
                      <a
                        href={getSiteUrl(project.generated_hostname)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {project.generated_hostname}
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
