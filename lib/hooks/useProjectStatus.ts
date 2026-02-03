'use client';

import { useState, useEffect, useRef } from 'react';
import type { ProjectStatus } from '@prisma/client';

interface ProjectStatusData {
  id: string;
  status: ProjectStatus;
  selectedPlaceId: string | null;
  selectedWebsiteUrl: string | null;
  stepGbpScrape: unknown | null;
  stepWebsiteScrape: unknown | null;
  stepImageAnalysis: unknown | null;
  updatedAt: string;
}

const TERMINAL_STATUSES: ProjectStatus[] = ['HTML_GENERATED', 'READY'];

export function useProjectStatus(projectId: string, pollInterval: number = 3000) {
  const [project, setProject] = useState<ProjectStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(pollInterval > 0);

  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    // Don't poll if interval is 0 or less
    if (pollInterval <= 0) {
      // Just fetch once
      fetch(`/api/projects/${projectId}/status`)
        .then((res) => res.json())
        .then((data) => {
          if (isMountedRef.current) {
            setProject(data);
            setIsLoading(false);
            setIsPolling(false);
          }
        })
        .catch((err) => {
          if (isMountedRef.current) {
            setError(err.message);
            setIsLoading(false);
            setIsPolling(false);
          }
        });
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/status`);
        if (!response.ok) {
          throw new Error('Failed to fetch project status');
        }
        const data = await response.json();

        if (!isMountedRef.current) return;

        setProject(data);
        setError(null);
        setIsLoading(false);

        // Check if we should stop polling
        if (TERMINAL_STATUSES.includes(data.status)) {
          setIsPolling(false);
          return;
        }

        // Schedule next poll
        timeoutRef.current = setTimeout(fetchStatus, pollInterval);
      } catch (err: any) {
        if (!isMountedRef.current) return;

        setError(err.message);
        setIsLoading(false);

        // Continue polling even on error
        timeoutRef.current = setTimeout(fetchStatus, pollInterval);
      }
    };

    // Start polling
    fetchStatus();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [projectId, pollInterval]);

  return {
    project,
    isLoading,
    isPolling,
    error,
  };
}
