'use client';

import { useProjectStatus } from '@/lib/hooks/useProjectStatus';
import type { ProjectStatus } from '@/types';

interface ProjectProgressProps {
  projectId: string;
  initialStatus: ProjectStatus;
  isPolling: boolean;
}

const WORKFLOW_STEPS: { status: ProjectStatus; label: string }[] = [
  { status: 'GBP_SELECTED', label: 'Business Selected' },
  { status: 'GBP_SCRAPED', label: 'Scraping Profile Data' },
  { status: 'WEBSITE_SCRAPED', label: 'Scraping Website' },
  { status: 'IMAGES_ANALYZED', label: 'Analyzing Images' },
  { status: 'HTML_GENERATED', label: 'Generating Site' },
  { status: 'READY', label: 'Ready' },
];

export function ProjectProgress({
  projectId,
  initialStatus,
  isPolling,
}: ProjectProgressProps) {
  const { project, error } = useProjectStatus(
    projectId,
    isPolling ? 5000 : 0
  );

  const currentStatus = project?.status || initialStatus;

  const currentStepIndex = WORKFLOW_STEPS.findIndex(
    (step) => step.status === currentStatus
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Progress</h2>
        {isPolling && currentStatus !== 'HTML_GENERATED' && currentStatus !== 'READY' && (
          <span className="flex items-center gap-2 text-sm text-blue-600">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
        <div
          className="absolute left-6 top-6 w-0.5 bg-blue-600 transition-all duration-500"
          style={{
            height: currentStepIndex >= 0
              ? `${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%`
              : '0%',
          }}
        />

        {/* Steps */}
        <div className="relative space-y-6">
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.status} className="flex items-start">
                {/* Circle indicator */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-blue-600 border-blue-600'
                      : isCurrent
                        ? 'bg-white border-blue-600'
                        : 'bg-white border-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Label */}
                <div className="ml-4 pt-2">
                  <p
                    className={`font-medium transition-colors ${
                      isCompleted || isCurrent
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && isPolling && currentStatus !== 'HTML_GENERATED' && currentStatus !== 'READY' && (
                    <p className="text-sm text-blue-600 mt-1">In progress...</p>
                  )}
                  {isCurrent && (currentStatus === 'HTML_GENERATED' || currentStatus === 'READY') && (
                    <p className="text-sm text-green-600 mt-1">Complete!</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
