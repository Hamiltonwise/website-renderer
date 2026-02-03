'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Start loading - immediately show progress
  const startLoading = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    progressRef.current = 0;
    startTimeRef.current = Date.now();
    setProgress(20); // Start at 20% immediately for visibility
    setIsLoading(true);
  }, []);

  // Complete loading
  const completeLoading = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setProgress(100);
    // Hide after animation completes
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      progressRef.current = 0;
    }, 300);
  }, []);

  // Handle navigation completion
  useEffect(() => {
    if (isLoading) {
      completeLoading();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Animate progress
  useEffect(() => {
    if (isLoading && progress < 90) {
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        // Fast start, then slow down - reaches ~85% in about 3 seconds
        const targetProgress = Math.min(90, 20 + (70 * (1 - Math.exp(-elapsed / 1500))));

        if (targetProgress > progressRef.current) {
          progressRef.current = targetProgress;
          setProgress(targetProgress);
        }

        if (progressRef.current < 90) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isLoading, progress]);

  // Listen for navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        // Only trigger for internal navigation links
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          const currentPath = window.location.pathname + window.location.search;
          if (href !== currentPath) {
            startLoading();
          }
        }
      }
    };

    // Also listen for programmatic navigation via custom event
    const handleNavigationStart = () => {
      startLoading();
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('navigation-start', handleNavigationStart);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('navigation-start', handleNavigationStart);
    };
  }, [startLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1">
      {/* Background track */}
      <div className="absolute inset-0 bg-brand-100" />
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400"
        style={{
          width: `${progress}%`,
          transition: progress === 100
            ? 'width 150ms ease-out'
            : progress === 20
            ? 'width 0ms' // Instant start
            : 'width 300ms ease-out',
          boxShadow: '0 0 10px rgba(214, 104, 83, 0.7), 0 0 5px rgba(214, 104, 83, 0.5)',
        }}
      />
      {/* Animated glow pulse at the end of the bar */}
      <div
        className="absolute top-0 h-full w-24 animate-pulse"
        style={{
          left: `calc(${progress}% - 48px)`,
          background: 'linear-gradient(90deg, transparent, rgba(214, 104, 83, 0.6), transparent)',
          transition: progress === 100 ? 'left 150ms ease-out' : 'left 300ms ease-out',
        }}
      />
    </div>
  );
}
