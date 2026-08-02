import { useEffect, useState } from 'react';
import { getCatalogueEntry } from './catalogue';
import { resolveTheme } from './defaults';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
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
 * NOTE: this is the API skeleton. The markup below is intentionally minimal — enough to
 * prove config flows through to rendered nodes and to fix the DOM contract (element
 * structure, `data-*` hooks, CSS custom properties). The finished visuals get ported over
 * from the site build on top of this. See PALLET-PLAN.md §8 phase 3.
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
      className={className}
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
          fontFamily: 'var(--pallet-font)',
        } as React.CSSProperties
      }
    >
      <ol data-pallet-trail="">
        {items.map((item) => {
          const isActive = item.href === currentHref;
          const sprite = resolveSprite(item);

          return (
            <li key={item.href} data-pallet-node="" data-active={isActive ? '' : undefined}>
              <a href={item.href} aria-current={isActive ? 'page' : undefined}>
                {sprite ? (
                  <img src={sprite.url} alt={sprite.alt(item.label)} data-pallet-sprite="" />
                ) : null}
                <span data-pallet-label="">{item.label}</span>
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
function resolveSprite(item: NavItem): { url: string; alt: (label: string) => string } | null {
  if (item.spriteUrl) {
    return { url: item.spriteUrl, alt: (label) => label };
  }

  if (item.pokemonId !== undefined) {
    const entry = getCatalogueEntry(item.pokemonId);
    if (!entry) return null;
    return {
      url: entry.iconAsset,
      alt: (label) => `${capitalize(entry.name)} — ${label}`,
    };
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
