import styles from './pallet.module.css';
import type { TrailPoint } from './useTrailGeometry';
import type { DotStyle, NavOrientation } from './types';

/**
 * A cubic bezier reaches its maximum lateral deviation at t=0.5, and for a segment whose
 * two control points are both offset perpendicular by `k`, that deviation is 0.75k. So to
 * hit a requested amplitude we scale the control offset up by the inverse.
 */
const AMPLITUDE_TO_CONTROL = 1 / 0.75;

/** Stroke width of the trail, matched to the 2px CSS border used by the straight trail. */
const STROKE_WIDTH = 2;

/** Wide enough to fully cover the dotted stroke, including its round caps. */
const MASK_STROKE_WIDTH = STROKE_WIDTH * 4;

interface DashSpec {
  dasharray?: string;
  linecap: 'round' | 'butt';
}

/**
 * Mirrors the CSS `dotStyle` values along a curve. A dotted border has no SVG equivalent,
 * so dots are drawn as a zero-length dash with a round cap — the cap is the dot.
 */
function dashFor(dotStyle: DotStyle): DashSpec {
  switch (dotStyle) {
    case 'dotted':
      return { dasharray: `0.01 ${STROKE_WIDTH * 3.5}`, linecap: 'round' };
    case 'dashed':
      return { dasharray: `${STROKE_WIDTH * 3.5} ${STROKE_WIDTH * 3}`, linecap: 'butt' };
    case 'solid':
      return { linecap: 'butt' };
  }
}

/**
 * Builds the trail as one continuous path through every node center.
 *
 * Each segment bulges to the opposite side of the previous one at a constant amplitude, so
 * the result reads as one winding road rather than a series of unrelated wobbles. The
 * alternation is also what makes the curve smooth at the nodes: the outgoing tangent of
 * segment i is (-s·k, d/3) and the incoming tangent of segment i+1 is (s'·k, d/3) with
 * s' = -s, so the two agree and there is no visible kink where they meet.
 *
 * Every segment starts and ends exactly on a measured node center, so the sprite circles
 * sit precisely on the path by construction rather than by tuning.
 */
export function buildTrailPath(
  points: TrailPoint[],
  orientation: NavOrientation,
  amplitude: number,
  wavy: boolean,
): string {
  if (points.length < 2) return '';

  const first = points[0];
  if (!first) return '';

  const isVertical = orientation !== 'horizontal';
  const control = amplitude * AMPLITUDE_TO_CONTROL;
  let d = `M ${round(first.x)} ${round(first.y)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) break;

    if (!wavy) {
      d += ` L ${round(b.x)} ${round(b.y)}`;
      continue;
    }

    const side = i % 2 === 0 ? 1 : -1;
    const offset = side * control;

    if (isVertical) {
      const third = (b.y - a.y) / 3;
      d +=
        ` C ${round(a.x + offset)} ${round(a.y + third)},` +
        ` ${round(b.x + offset)} ${round(b.y - third)},` +
        ` ${round(b.x)} ${round(b.y)}`;
    } else {
      const third = (b.x - a.x) / 3;
      d +=
        ` C ${round(a.x + third)} ${round(a.y + offset)},` +
        ` ${round(b.x - third)} ${round(b.y + offset)},` +
        ` ${round(b.x)} ${round(b.y)}`;
    }
  }

  return d;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface TrailSvgProps {
  points: TrailPoint[];
  width: number;
  height: number;
  amplitude: number;
  orientation: NavOrientation;
  dotStyle: DotStyle;
  wavy: boolean;
  /** Omitted when the consumer is not driving scroll fill. */
  scrollProgress?: number;
  /** Stable per-instance id, so multiple navs on one page don't share a mask. */
  maskId: string;
}

/**
 * The curved trail, plus its scroll-fill overlay.
 *
 * Fill is done with a mask rather than by dashing the visible path, because the visible
 * path is *already* using its dash array to look dotted — the two cannot share it. The
 * mask path carries `pathLength="1"`, which renormalizes its dash units so a dash array of
 * `1 1` and an offset of `1 - progress` reveals exactly the first `progress` fraction of
 * the curve regardless of its real length. The visible paths deliberately have no
 * `pathLength`, so their dash arrays stay in real pixels and the dots keep a constant
 * spacing whatever the trail's length.
 */
export function TrailSvg({
  points,
  width,
  height,
  amplitude,
  orientation,
  dotStyle,
  wavy,
  scrollProgress,
  maskId,
}: TrailSvgProps) {
  const d = buildTrailPath(points, orientation, amplitude, wavy);
  if (!d) return null;

  const dash = dashFor(dotStyle);
  const showFill = scrollProgress !== undefined;
  const progress = clamp01(scrollProgress ?? 0);

  const nodesMaskId = `${maskId}-nodes`;
  // Generous bounds: the wave and its stroke both extend past the list's own box.
  const pad = 64;

  return (
    <svg
      className={styles.trailSvg}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      data-pallet-trail-svg=""
    >
      <defs>
        {/*
         * Punches each node's circle out of the trail, so the curve stops at the ring's
         * outer edge instead of running under the ring and across the sprite. This is what
         * makes the wavy trail match the straight one, whose CSS segments only ever span
         * the gap between nodes.
         *
         * Done as a mask rather than by shortening the path: the path still runs center to
         * center, which is what keeps the segment endpoints exactly on the node centers and
         * the tangents continuous across each node. Trimming the geometry would trade that
         * away for the same visual result.
         */}
        <mask id={nodesMaskId} maskUnits="userSpaceOnUse">
          <rect
            x={-pad}
            y={-pad}
            width={width + pad * 2}
            height={height + pad * 2}
            fill="#fff"
          />
          {points.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r={point.r} fill="#000" />
          ))}
        </mask>

        {showFill ? (
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <path
              className={styles.trailMask}
              d={d}
              pathLength="1"
              fill="none"
              stroke="#fff"
              strokeWidth={MASK_STROKE_WIDTH}
              strokeDasharray="1 1"
              strokeDashoffset={1 - progress}
            />
          </mask>
        ) : null}
      </defs>

      <g mask={`url(#${nodesMaskId})`}>
        <path
          className={styles.trailBase}
          d={d}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={dash.dasharray}
          strokeLinecap={dash.linecap}
        />

        {showFill ? (
          <path
            className={styles.trailFill}
            d={d}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={dash.dasharray}
            strokeLinecap={dash.linecap}
            mask={`url(#${maskId})`}
          />
        ) : null}
      </g>
    </svg>
  );
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
