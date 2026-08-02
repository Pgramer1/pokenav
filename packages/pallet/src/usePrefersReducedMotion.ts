import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Tracks the user's reduced-motion preference.
 *
 * Starts `false` so server and first client render agree (no hydration mismatch), then
 * corrects after mount. Per PALLET-PLAN.md §4, motion is fully suppressed when this is
 * true — not just shortened.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(QUERY);
    setPrefersReducedMotion(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return prefersReducedMotion;
}
