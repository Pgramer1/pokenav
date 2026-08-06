import { useId, useMemo } from 'react';
import { analyticGeometry } from './analyticGeometry';
import { resolveTheme } from './defaults';
import { isItemActive } from './matchActive';
import { TrailSvg } from './TrailSvg';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useTrailGeometry } from './useTrailGeometry';
import styles from './pallet.module.css';
import type { MatchActive, NavOrientation, NavPosition, NavTheme } from './types';

/**
 * A node whose sprite has already been resolved to a URL.
 *
 * The split between this and `NavItem` is what makes the two entry points possible. Sprite
 * *resolution* is the only thing `pokenav` and `pokenav/pokemon` do differently, and it is
 * the only thing that pulls in the catalogue and the 898 sprite chunks. Isolating it above
 * this component means the renderer — every bit of geometry, styling and accessibility
 * below — is shared verbatim, and the core entry point genuinely never references the
 * catalogue rather than merely avoiding it at runtime.
 */
export interface NavViewItem {
  label: string;
  href: string;
  /**
   * Resolved sprite URL. `undefined` covers both "this item has no sprite" and "its sprite
   * is still loading", which render identically on purpose: a label-only node, with the
   * ring and trail still drawn so nothing shifts when the artwork arrives.
   */
  url: string | undefined;
  /**
   * Accessible name for the sprite image. An empty string marks it decorative, which hands
   * the accessible name back to the visible label.
   */
  alt: string;
}

export interface NavViewProps {
  position: NavPosition;
  orientation: NavOrientation;
  items: NavViewItem[];
  theme?: NavTheme;
  matchActive?: MatchActive;
  activeHref?: string;
  scrollProgress?: number;
  ariaLabel?: string;
  className?: string;
}

/**
 * The rendering half of the nav, shared by both entry points.
 *
 * Rendering notes:
 * - The ring, its pokéball detailing, and the straight trail are drawn in CSS via
 *   pseudo-elements. Only the wavy trail needs an element, because a curve through node
 *   centers cannot be expressed as a border.
 * - The `data-*` attributes below are the public styling contract. They are what the
 *   stylesheet keys off, and what consumers should target to restyle from outside.
 * - The component holds no route state and subscribes to nothing.
 */
export function NavView({
  position,
  orientation,
  items,
  theme,
  matchActive,
  activeHref,
  scrollProgress,
  ariaLabel = 'Site navigation',
  className,
}: NavViewProps) {
  const resolvedTheme = resolveTheme(theme);
  const prefersReducedMotion = usePrefersReducedMotion();
  const maskId = `pallet-trail-${useId()}`;

  const isWavy = resolvedTheme.trailPath === 'wavy';

  /*
   * The curve the stylesheet's defaults imply, available on the very first render — server
   * included. Memoized because the measuring hook compares against it and holds it in an
   * effect dependency; a fresh object each render would re-run measurement every pass.
   */
  const computed = useMemo(
    () => (isWavy ? analyticGeometry(items.length, orientation) : null),
    [isWavy, items.length, orientation],
  );

  // Non-null only when the real layout disagrees with `computed` — see useTrailGeometry.
  const { geometry: measured, containerRef, setNodeRef } = useTrailGeometry(
    isWavy,
    items.length,
    computed,
  );

  const trail = measured ?? computed;

  const hasScrollFill = scrollProgress !== undefined;
  const segmentCount = Math.max(items.length - 1, 1);
  const reachedIndex = reachedNodeIndex(scrollProgress, items.length);

  return (
    <nav
      aria-label={ariaLabel}
      className={className ? `${styles.nav} ${className}` : styles.nav}
      data-pallet=""
      data-position={position}
      data-orientation={orientation}
      data-ring-style={resolvedTheme.ringStyle}
      data-trail-path={resolvedTheme.trailPath}
      /*
       * Three attributes rather than one, because they answer three different questions.
       * `data-trail-svg` says an SVG trail is on screen, which is what tells the stylesheet
       * to stand its CSS segments down — true during server rendering now that the curve
       * can be computed. `data-trail-analytic` says that SVG is in ring-column coordinates
       * and needs edge anchoring. `data-trail-measured` says layout has been read and
       * disagreed, and is kept because it was already part of the rendered surface.
       */
      data-trail-svg={trail ? '' : undefined}
      data-trail-analytic={trail && !measured ? '' : undefined}
      data-trail-measured={measured ? '' : undefined}
      data-scroll-fill={hasScrollFill ? '' : undefined}
      data-reduced-motion={prefersReducedMotion ? '' : undefined}
      style={
        {
          '--pallet-accent': resolvedTheme.accentColor,
          '--pallet-surface': resolvedTheme.surfaceColor,
          '--pallet-dot-style': resolvedTheme.dotStyle,
          '--pallet-font': resolvedTheme.font,
        } as React.CSSProperties
      }
    >
      {/*
       * The wrapper exists so the SVG has a positioned box to fill that is a valid sibling
       * of the list. An <svg> cannot be a child of <ol>, and the overlay has to share the
       * list's coordinate space for the points to line up.
       */}
      <div className={styles.trailWrap} ref={containerRef} data-pallet-trail-wrap="">
        {trail ? (
          <TrailSvg
            points={trail.points}
            width={trail.width}
            height={trail.height}
            amplitude={trail.amplitude}
            orientation={orientation}
            dotStyle={resolvedTheme.dotStyle}
            wavy
            scrollProgress={scrollProgress}
            maskId={maskId}
          />
        ) : null}

        <ol className={styles.trail} data-pallet-trail="">
          {items.map((item, index) => {
            const isActive = isItemActive(item.href, activeHref, matchActive);

            return (
              <li
                key={item.href}
                className={styles.node}
                data-pallet-node=""
                data-active={isActive ? '' : undefined}
                data-reached={index === reachedIndex ? '' : undefined}
                style={
                  hasScrollFill
                    ? ({
                        // How much of the segment *after* this node is filled, 0–1. Only
                        // consumed by the straight trail; the wavy trail fills via the SVG
                        // mask, which follows the curve rather than a stack of segments.
                        '--pallet-segment-fill': segmentFill(scrollProgress, segmentCount, index),
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <a
                  href={item.href}
                  className={styles.link}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.ring} data-pallet-ring="" ref={setNodeRef(index)}>
                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.alt}
                        className={styles.sprite}
                        data-pallet-sprite=""
                      />
                    ) : null}
                  </span>
                  {/*
                   * A sprite with a non-empty alt already carries the section name (§5:
                   * "{Pokémon name} — {section name}"), so the link's accessible name is
                   * complete without this span. Leaving it exposed would make a screen
                   * reader announce the section twice — "Eevee — Home, Home". Hiding it is
                   * what keeps the §5 alt-text rule and a clean announcement compatible.
                   *
                   * With no sprite, or a deliberately decorative one (`alt: ''`), there is
                   * no alt text to carry the name, so the label must stay exposed.
                   */}
                  <span
                    className={styles.label}
                    data-pallet-label=""
                    aria-hidden={item.url && item.alt ? 'true' : undefined}
                  >
                    {item.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/**
 * Index of the last node the trail fill has actually arrived at, or -1 when scroll fill is
 * not in use.
 *
 * Deliberately `floor` rather than `round`: the glow marks where the trail *has reached*,
 * so it should not jump to a node the fill is still travelling toward. At 80% of the way to
 * the next node, the previous one is still the one the trail has got to.
 */
function reachedNodeIndex(progress: number | undefined, count: number): number {
  if (progress === undefined || !Number.isFinite(progress) || count < 1) return -1;
  const clamped = Math.min(1, Math.max(0, progress));
  const segments = Math.max(count - 1, 1);
  // The epsilon absorbs float error at exactly 1.0 so the final node still lights up.
  return Math.min(count - 1, Math.floor(clamped * segments + 1e-9));
}

/** Fraction of the segment following `index` that scroll progress has reached, 0–1. */
function segmentFill(progress: number | undefined, segments: number, index: number): number {
  if (progress === undefined || !Number.isFinite(progress)) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(1, Math.max(0, clamped * segments - index));
}
