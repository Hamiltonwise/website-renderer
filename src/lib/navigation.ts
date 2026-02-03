/**
 * Utility to trigger the global loading indicator for programmatic navigation
 */
export function triggerNavigationLoading() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('navigation-start'));
  }
}
