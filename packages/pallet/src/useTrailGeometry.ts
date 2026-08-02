import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface TrailPoint {
  x: number;
  y: number;
  /**
   * Outer radius of the node's ring in layout pixels, deliberately excluding any scale
   * transform. See the note in `measure` for why the untransformed value is the correct
   * one here.
   */
  r: number;
}

export interface TrailGeometry {
  points: TrailPoint[];
  width: number;
  height: number;
  amplitude: number;
}

const EMPTY: TrailGeometry = { points: [], width: 0, height: 0, amplitude: 0 };

/** Default wave amplitude in px, used when --pallet-wave-amplitude is not set. */
const FALLBACK_AMPLITUDE = 10;

/**
 * `useLayoutEffect` warns when it runs during server rendering. Measuring has to happen
 * before paint — otherwise the trail visibly pops in — so we take the layout effect on the
 * client and degrade to a plain effect on the server, where it never runs anyway.
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Measures the center of every node ring, in coordinates relative to the trail container.
 *
 * The wavy trail is an SVG drawn through these points, so they have to be the *real*
 * on-screen centers rather than positions derived from the CSS custom properties. Deriving
 * them would silently drift the moment a consumer overrode a size, changed the font, or let
 * a label wrap — and drift is exactly the failure the spec calls out ("the sprite circles
 * need to sit exactly where the path passes"). Measuring costs a layout read; being wrong
 * costs the whole illusion.
 *
 * Note that the active node carries a `scale()` transform. `getBoundingClientRect` reports
 * the transformed box, but scaling happens about the center, so the center we care about is
 * unaffected.
 */
export function useTrailGeometry(enabled: boolean, count: number): TrailGeometry & {
  containerRef: React.RefObject<HTMLDivElement | null>;
  setNodeRef: (index: number) => (el: HTMLElement | null) => void;
} {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Array<HTMLElement | null>>([]);
  const [geometry, setGeometry] = useState<TrailGeometry>(EMPTY);

  const setNodeRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      nodeRefs.current[index] = el;
    },
    [],
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const box = container.getBoundingClientRect();
    const points: TrailPoint[] = [];

    for (let i = 0; i < count; i += 1) {
      const el = nodeRefs.current[i];
      // A missing ref means the render is mid-flight; bail rather than draw a partial path.
      if (!el) return;
      const rect = el.getBoundingClientRect();
      points.push({
        // Scaling happens about the center, so the transformed rect still yields the right
        // center — but not the right radius.
        x: rect.left - box.left + rect.width / 2,
        y: rect.top - box.top + rect.height / 2,
        /*
         * `offsetWidth` is the layout width, before the highlighted node's scale transform.
         * Using it instead of the transformed rect is deliberate on two counts.
         *
         * Correctness: transforms do not trigger ResizeObserver, and a transform mid
         * transition has not settled, so a transform-derived radius goes stale the moment
         * the highlight moves between nodes and never recovers.
         *
         * Asymmetric failure: the two errors are not equally bad. A punch slightly smaller
         * than the scaled ring is invisible, because the ring band paints above this SVG
         * and covers the difference. A punch slightly larger leaves a visible gap between
         * the ring and the start of the trail. The untransformed radius can only ever err
         * in the harmless direction.
         */
        r: el.offsetWidth / 2,
      });
    }

    const declared = getComputedStyle(container).getPropertyValue('--pallet-wave-amplitude');
    const parsed = Number.parseFloat(declared);
    const amplitude = Number.isFinite(parsed) ? parsed : FALLBACK_AMPLITUDE;

    const next: TrailGeometry = { points, width: box.width, height: box.height, amplitude };
    // Bail out of identical updates — the ResizeObserver below would otherwise be able to
    // trade re-renders with itself.
    setGeometry((prev) => (isSameGeometry(prev, next) ? prev : next));
  }, [count]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      setGeometry((prev) => (prev === EMPTY ? prev : EMPTY));
      return;
    }

    measure();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    // Observing the nodes as well as the container catches label reflow and late-loading
    // webfonts, which move node centers without changing the container's own box.
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    nodeRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [enabled, measure]);

  return { ...geometry, containerRef, setNodeRef };
}

function isSameGeometry(a: TrailGeometry, b: TrailGeometry): boolean {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.amplitude === b.amplitude &&
    a.points.length === b.points.length &&
    a.points.every(
      (point, i) =>
        point.x === b.points[i]?.x && point.y === b.points[i]?.y && point.r === b.points[i]?.r,
    )
  );
}
