import { useEffect, useState } from 'react';
import { getCatalogueEntry } from './catalogue';
import { resolveTheme } from './defaults';
import { getSpriteDataUrl } from './sprites';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import styles from './pallet.module.css';
import type { NavConfig, NavItem } from './types';

export interface PalletProps extends NavConfig {
  /**
   * The currently active route. When omitted, falls back to `window.location.pathname`
   * after mount.
   *
   * Next.js App Router consumers should pass `usePathname()` — the package deliberately
   * takes no dependency on `next` so it stays usable outside Next.
   */
  activeHref?: string;
  /** Accessible name for the landmark. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Route-map style navigation: a trail of circular sprite nodes connected by a dotted line.
 *
 * The base look lives in `pallet.module.css`. The `data-*` attributes below are the public
 * styling contract — consumers target those, not the hashed class names. Theme variants
 * (`ringStyle: 'pokeball'`, `trailPath: 'wavy'`) and horizontal orientation are declared in
 * the types but not implemented yet; they're PALLET-PLAN.md §8 phase 4.
 */
export function Pallet({
  position,
  orientation,
  items,
  theme,
  activeHref,
  ariaLabel = 'Site navigation',
  className,
}: PalletProps) {
  const resolvedTheme = resolveTheme(theme);
  const prefersReducedMotion = usePrefersReducedMotion();
  const currentHref = useCurrentHref(activeHref);

  return (
    <nav
      aria-label={ariaLabel}
      className={className ? `${styles.nav} ${className}` : styles.nav}
      data-pallet=""
      data-position={position}
      data-orientation={orientation}
      data-ring-style={resolvedTheme.ringStyle}
      data-trail-path={resolvedTheme.trailPath}
      data-reduced-motion={prefersReducedMotion ? '' : undefined}
      style={
        {
          '--pallet-accent': resolvedTheme.accentColor,
          '--pallet-dot-style': resolvedTheme.dotStyle,
          '--pallet-font': resolvedTheme.font,
        } as React.CSSProperties
      }
    >
      <ol className={styles.trail} data-pallet-trail="">
        {items.map((item) => {
          const isActive = item.href === currentHref;
          const sprite = resolveSprite(item);

          return (
            <li
              key={item.href}
              className={styles.node}
              data-pallet-node=""
              data-active={isActive ? '' : undefined}
            >
              <a
                href={item.href}
                className={styles.link}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles.ring} data-pallet-ring="">
                  {sprite ? (
                    <img
                      src={sprite.url}
                      alt={sprite.alt}
                      className={styles.sprite}
                      data-pallet-sprite=""
                    />
                  ) : null}
                </span>
                <span className={styles.label} data-pallet-label="">
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Resolves an item to its sprite.
 *
 * `spriteUrl` always wins and bypasses the catalogue — that escape hatch is what makes
 * this a general nav library rather than a Pokémon-only one (PALLET-PLAN.md §3).
 *
 * Alt text follows §5: `"{Pokémon name} — {section name}"`, never the species alone. A
 * custom `spriteUrl` has no species name, so the label carries it.
 */
function resolveSprite(item: NavItem): { url: string; alt: string } | null {
  if (item.spriteUrl) {
    return { url: item.spriteUrl, alt: item.label };
  }

  if (item.pokemonId !== undefined) {
    const entry = getCatalogueEntry(item.pokemonId);
    const url = getSpriteDataUrl(item.pokemonId);
    if (!entry || !url) return null;
    return { url, alt: `${capitalize(entry.name)} — ${item.label}` };
  }

  return null;
}

/** Falls back to the browser's pathname when no `activeHref` is supplied. */
function useCurrentHref(activeHref?: string): string | undefined {
  const [pathname, setPathname] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (activeHref !== undefined || typeof window === 'undefined') return;
    setPathname(window.location.pathname);
  }, [activeHref]);

  return activeHref ?? pathname;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
