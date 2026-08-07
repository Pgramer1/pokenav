import type { TrailGeometry } from './useTrailGeometry';
import type { NavGeometry, NavOrientation } from './types';

/**
 * Node geometry computed from the stylesheet's own defaults, with no layout read.
 *
 * This is what lets the wavy trail exist in server-rendered HTML. Measuring can only happen
 * after hydration, so a measurement-only trail paints straight and then curves — a visible
 * shift, and on the more distinctive of the two trail styles. Every input the path needs is
 * a constant in `pallet.module.css`, so the common case can be computed instead of measured
 * and the curve is simply there in the first paint.
 *
 * The defaults come from `cssGeometry.ts`, which is generated from `pallet.module.css` —
 * the values are declared once, in the stylesheet, and mirrored into TypeScript by the
 * build. They used to be literals here, which meant editing the CSS silently desynchronised
 * the server-rendered curve from the layout the browser actually produced.
 *
 * They can still be wrong for a given page — a consumer overriding `--pallet-node-size` in
 * their own CSS, a root font size that isn't 16px, a label that wraps past the node — which
 * is why the measured path still runs and takes over on disagreement. `theme.geometry` is
 * the way to get an override right on the first frame instead of the second.
 */

/**
 * How far a point may sit from its computed position before measurement is believed over
 * computation. Half a pixel — below that the two paths are the same picture, and switching
 * would re-render for nothing.
 */
const TOLERANCE = 0.5;

/**
 * The geometry the stylesheet's defaults imply, or `null` when there is no trail to draw.
 *
 * Coordinates are local to the ring column rather than to the trail container, because the
 * container's width is exactly the thing that cannot be known without measuring. The
 * stylesheet anchors the SVG to the matching edge (`data-trail-analytic`), which is what
 * makes a 64px-wide coordinate space land in the right place inside a container of any
 * width — including the right-anchored and centered positions.
 */
export function analyticGeometry(
  count: number,
  orientation: NavOrientation,
  geometry: Required<NavGeometry>,
): TrailGeometry | null {
  if (count < 2) return null;

  const { nodeSize, gap, waveAmplitude } = geometry;
  const radius = nodeSize / 2;
  const pitch = nodeSize + gap;
  const span = count * nodeSize + (count - 1) * gap;
  const isVertical = orientation !== 'horizontal';

  const points = Array.from({ length: count }, (_, i) => ({
    x: isVertical ? radius : i * pitch + radius,
    y: isVertical ? i * pitch + radius : radius,
    r: radius,
  }));

  return {
    points,
    width: isVertical ? nodeSize : span,
    height: isVertical ? span : nodeSize,
    amplitude: waveAmplitude,
  };
}

/**
 * Whether measured geometry describes the same curve the computed geometry already drew.
 *
 * Compared after translating both to a common origin, because the two are expressed in
 * different coordinate spaces by design — the computed one is local to the ring column, the
 * measured one is relative to the trail container. What matters is the *shape*: the spacing
 * between node centers, the punch radii, and the wave amplitude. Container width and height
 * only size the viewBox, so a difference there is not a reason to redraw.
 */
export function isSameShape(computed: TrailGeometry, measured: TrailGeometry): boolean {
  if (computed.points.length !== measured.points.length) return false;
  if (Math.abs(computed.amplitude - measured.amplitude) > TOLERANCE) return false;

  const origin = computed.points[0];
  const measuredOrigin = measured.points[0];
  if (!origin || !measuredOrigin) return false;

  return computed.points.every((point, i) => {
    const other = measured.points[i];
    if (!other) return false;
    return (
      Math.abs(point.x - origin.x - (other.x - measuredOrigin.x)) <= TOLERANCE &&
      Math.abs(point.y - origin.y - (other.y - measuredOrigin.y)) <= TOLERANCE &&
      Math.abs(point.r - other.r) <= TOLERANCE
    );
  });
}
