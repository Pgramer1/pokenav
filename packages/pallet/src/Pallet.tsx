import { useId } from 'react';
import { getCatalogueEntry } from './catalogue';
import { resolveTheme } from './defaults';
import { getSpriteDataUrl } from './sprites';
import { TrailSvg } from './TrailSvg';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useTrailGeometry } from './useTrailGeometry';
import styles from './pallet.module.css';
import type { NavConfig, NavItem } from './types';

export interface PalletProps extends NavConfig {
  /**
   * The href of the currently active route.
   *
   * Deliberately a plain prop with no router coupling: the component does a string
   * comparison and nothing else. The consumer decides how to compute it — `usePathname()`
   * in the Next App Router, `useRouter().asPath` in Pages, `useLocation()` in React
   * Router, a static string in a one-page site, or their own scroll-spy for section
   * navigation. Omit it and no node is active.
   */
  activeHref?: string;
  /**
   * Scroll position as a 0–1 fraction. Progressively fills the trail in `accentColor`.
   *
   * Same reasoning as `activeHref`: sourced from the consumer rather than read off
   * `window` internally, so the component works anywhere — inside a scroll container, a
   * virtualized list, an embedded panel, or driven by something that isn't scroll at all.
   * `useScrollProgress()` is exported for the ordinary page-scroll case.
   *
   * Omit it and no fill layer renders. This is a separate visual layer from the
   * route-based active node, which is unaffected.
   */
  scrollProgress?: number;
  /** Accessible name for the `<nav>` landmark. */
  ariaLabel?: string;
  /** Merged onto the root element's own class. */
  className?: string;
}

/**
 * Route-map style navigation: a trail of circular sprite nodes connected by a dotted line.
 *
 * Rendering notes:
 * - The ring, its pokéball detailing, and the straight trail are drawn in CSS via
 *   pseudo-elements. Only the wavy trail needs an element, because a curve through measured
 *   points cannot be expressed as a border.
 * - The `data-*` attributes below are the public styling contract. They are what the
 *   stylesheet keys off, and what consumers should target to restyle from outside.
 * - The component holds no route state and subscribes to nothing.
 */
export function Pallet({
  position,
  orientation,
  items,
  theme,
  activeHref,
  scrollProgress,
  ariaLabel = 'Site navigation',
  className,
}: PalletProps) {
  const resolvedTheme = resolveTheme(theme);
  const prefersReducedMotion = usePrefersReducedMotion();
  const maskId = `pallet-trail-${useId()}`;

  const isWavy = resolvedTheme.trailPath === 'wavy';
  const { containerRef, setNodeRef, points, width, height, amplitude } = useTrailGeometry(
    isWavy,
    items.length,
  );

  // Only true once every node has been measured. Until then the CSS straight trail stays
  // visible, so server-rendered and no-JS output still shows a connected trail rather than
  // a row of orphaned circles.
  const isMeasured = points.length === items.length && items.length > 1;

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
      data-trail-measured={isMeasured ? '' : undefined}
      data-scroll-fill={hasScrollFill ? '' : undefined}
      data-reduced-motion={prefersReducedMotion ? '' : undefined}
      style={
        {
          '--pallet-accent': resolvedTheme.accentColor,
          '--pallet-dot-style': resolvedTheme.dotStyle,
          '--pallet-font': resolvedTheme.font,
        } as React.CSSProperties
      }
    >
      {/*
       * The wrapper exists so the SVG has a positioned box to fill that is a valid sibling
       * of the list. An <svg> cannot be a child of <ol>, and the overlay has to share the
       * list's coordinate space for the measured points to line up.
       */}
      <div className={styles.trailWrap} ref={containerRef} data-pallet-trail-wrap="">
        {isWavy && isMeasured ? (
          <TrailSvg
            points={points}
            width={width}
            height={height}
            amplitude={amplitude}
            orientation={orientation}
            dotStyle={resolvedTheme.dotStyle}
            wavy
            scrollProgress={scrollProgress}
            maskId={maskId}
          />
        ) : null}

        <ol className={styles.trail} data-pallet-trail="">
          {items.map((item, index) => {
            const isActive = item.href === activeHref;
            const sprite = resolveSprite(item);

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
                    {sprite ? (
                      <img
                        src={sprite.url}
                        alt={sprite.alt}
                        className={styles.sprite}
                        data-pallet-sprite=""
                      />
                    ) : null}
                  </span>
                  {/*
                   * When a sprite is present its alt text already carries the section name
                   * (§5: "{Pokémon name} — {section name}"), so the link's accessible name is
                   * complete without this span. Leaving it exposed would make a screen
                   * reader announce the section twice — "Eevee — Home, Home". Hiding it is
                   * what keeps the §5 alt-text rule and a clean announcement compatible.
                   * With no sprite there is no alt text, so the label must stay exposed.
                   */}
                  <span
                    className={styles.label}
                    data-pallet-label=""
                    aria-hidden={sprite ? 'true' : undefined}
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

/**
 * Resolves an item to its sprite.
 *
 * `spriteUrl` always wins and bypasses the catalogue entirely — that escape hatch is what
 * makes this a general navigation library rather than a Pokémon-only one (§3).
 *
 * Alt text follows §5: `"{Pokémon name} — {section name}"`, never the species alone. A
 * custom sprite has no species name, so the label carries the whole accessible name.
 */
function resolveSprite(item: NavItem): { url: string; alt: string } | null {
  if (item.spriteUrl) {
    return { url: item.spriteUrl, alt: item.label };
  }

  if (item.pokemonId !== undefined) {
    const entry = getCatalogueEntry(item.pokemonId);
    const url = getSpriteDataUrl(item.pokemonId);
    // An id with no bundled sprite degrades to a label-only node rather than a broken
    // image. The ring still renders, so the trail keeps its shape.
    if (!entry || !url) return null;
    return { url, alt: `${capitalize(entry.name)} — ${item.label}` };
  }

  return null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
