import { useEffect, useState } from 'react';

/**
 * Convenience hook for the common case of "how far down the page am I", returning 0–1.
 *
 * `Pallet` deliberately does NOT call this. Scroll progress reaches the component as a
 * prop, exactly like `activeHref`, so the component stays usable where a window scroll
 * position is the wrong source or does not exist — a scroll container, a virtualized list,
 * an embedded panel, a Storybook story, a slide deck driven by keyboard. This hook is the
 * ergonomic default for consumers who *do* just want page scroll, opt-in and separable:
 *
 * ```tsx
 * <Pallet {...config} scrollProgress={useScrollProgress()} />
 * ```
 *
 * Pass a `target` to track a scrollable element instead of the document.
 */
export function useScrollProgress(target?: React.RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const element = target?.current ?? null;
    let frame = 0;

    const read = () => {
      frame = 0;
      if (element) {
        const scrollable = element.scrollHeight - element.clientHeight;
        setProgress(scrollable > 0 ? clamp01(element.scrollTop / scrollable) : 0);
        return;
      }
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? clamp01(window.scrollY / scrollable) : 0);
    };

    // Coalesce to one read per frame; scroll events fire far faster than we can paint.
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    read();

    const source: HTMLElement | Window = element ?? window;
    source.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      source.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [target]);

  return progress;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
