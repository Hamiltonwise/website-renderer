'use client';

import { motion } from 'framer-motion';
import {
  Globe,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { Project, ProjectStatus, Template } from '@/types';
import { GbpSelector } from './gbp-selector';
import { useProjectStatus } from '@/lib/hooks/useProjectStatus';
import { getSiteUrl } from '@/lib/utils/site-url';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType; progress: number; description: string }
> = {
  CREATED: {
    label: 'Project Created',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Clock,
    progress: 0,
    description: 'Select a Google Business Profile to get started.',
  },
  GBP_SELECTED: {
    label: 'Business Selected',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Loader2,
    progress: 15,
    description: 'Google Business Profile selected. Scraping profile data...',
  },
  GBP_SCRAPED: {
    label: 'Profile Scraped',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Loader2,
    progress: 30,
    description: 'Business profile data collected. Analyzing website...',
  },
  WEBSITE_SCRAPED: {
    label: 'Website Scraped',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Loader2,
    progress: 50,
    description: 'Website content extracted. Processing images...',
  },
  IMAGES_ANALYZED: {
    label: 'Images Analyzed',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: Loader2,
    progress: 70,
    description: 'Images analyzed with AI. Generating website...',
  },
  HTML_GENERATED: {
    label: 'Site Generated',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: CheckCircle2,
    progress: 90,
    description: 'Website generated. Finalizing deployment...',
  },
  READY: {
    label: 'Ready',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    progress: 100,
    description: 'Your website is live and ready!',
  },
};

interface ProjectDetailClientProps {
  project: Project;
  templates: Template[];
}

export function ProjectDetailClient({ project: initialProject, templates }: ProjectDetailClientProps) {
  // Poll for status updates every 5 seconds when processing
  const shouldPoll = !['CREATED', 'HTML_GENERATED', 'READY'].includes(initialProject.status);
  const { project: polledProject, isPolling } = useProjectStatus(
    initialProject.id,
    shouldPoll ? 5000 : 0
  );

  // Use polled data if available, otherwise use initial data
  const currentStatus = polledProject?.status || initialProject.status;
  const status = STATUS_CONFIG[currentStatus];
  const StatusIcon = status.icon;
  const isProcessing = ['GBP_SELECTED', 'GBP_SCRAPED', 'WEBSITE_SCRAPED', 'IMAGES_ANALYZED'].includes(currentStatus);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const siteUrl = getSiteUrl(initialProject.generated_hostname);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
      >
        <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {initialProject.generated_hostname}
                </h1>
                <p className="text-brand-100 mt-1">
                  Created {formatDate(initialProject.created_at)}
                </p>
              </div>
            </div>
            {currentStatus === 'READY' && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl px-4 py-2 font-medium transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Site
              </a>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor}`}>
              <StatusIcon
                className={`w-5 h-5 ${status.color} ${status.icon === Loader2 ? 'animate-spin' : ''}`}
              />
              <span className={`font-semibold ${status.color}`}>{status.label}</span>
            </div>
            <span className="text-gray-500 font-medium">{status.progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
            <motion.div
              key={currentStatus}
              initial={{ width: 0 }}
              animate={{ width: `${status.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-3 rounded-full bg-gradient-to-r from-brand-400 to-brand-500"
            />
          </div>

          <p className="text-gray-600">{status.description}</p>

          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-blue-700 font-medium">
                  Processing in progress.{isPolling ? ' Checking for updates...' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* GBP Selector - Only show for CREATED status */}
      {currentStatus === 'CREATED' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Select a Business
          </h2>
          <p className="text-gray-600 mb-6">
            Search for your Google Business Profile to generate a website based on your business information.
          </p>
          <GbpSelector
            projectId={initialProject.id}
            initialPlaceId={initialProject.selected_place_id}
            initialStatus={initialProject.status}
            templates={templates}
          />
        </motion.div>
      )}

      {/* Project Details */}
      {currentStatus !== 'CREATED' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Project Details</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Project ID</span>
              <span className="font-mono text-sm text-gray-900">{initialProject.id}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Hostname</span>
              <span className="font-medium text-gray-900">{initialProject.generated_hostname}</span>
            </div>
            {initialProject.selected_place_id && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Place ID</span>
                <span className="font-mono text-sm text-gray-900">{initialProject.selected_place_id}</span>
              </div>
            )}
            {initialProject.selected_website_url && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Source Website</span>
                <a
                  href={initialProject.selected_website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-700 hover:underline truncate max-w-[200px]"
                >
                  {initialProject.selected_website_url}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-gray-900">{formatDate(initialProject.updated_at)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
