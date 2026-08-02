import { getCatalogueEntry } from './catalogue';
import { resolveTheme } from './defaults';
import { getSpriteDataUrl } from './sprites';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
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
  /** Accessible name for the `<nav>` landmark. */
  ariaLabel?: string;
  /** Merged onto the root element's own class. */
  className?: string;
}

/**
 * Route-map style navigation: a trail of circular sprite nodes connected by a dotted line.
 *
 * Rendering notes:
 * - The ring, its pokéball detailing, and the trail segments are all drawn in CSS via
 *   pseudo-elements. There is no wrapper element here whose only job is to be painted.
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
  ariaLabel = 'Site navigation',
  className,
}: PalletProps) {
  const resolvedTheme = resolveTheme(theme);
  const prefersReducedMotion = usePrefersReducedMotion();

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
          const isActive = item.href === activeHref;
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
    </nav>
  );
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
