import { NavView, type NavViewItem } from './NavView';
import { toUrl } from './toUrl';
import { describeItem, warnOnce } from './warn';
import type { NavItem, PokenavProps } from './types';

/**
 * Route-map style navigation: a trail of circular sprite nodes connected by a dotted line.
 *
 * This is the **core** entry point. It resolves `spriteUrl` and nothing else: no
 * `catalogue.json`, no dynamic-import context over the 898 bundled sprites, and so none of
 * the sprite chunks a bundler would otherwise emit for them. It is also the only form that
 * renders artwork in server-side HTML, because a `spriteUrl` is already a URL by the time
 * it reaches the component.
 *
 * For `pokemonId`, import from `pokenav/pokemon` instead — same component, same props, plus
 * catalogue resolution and the bundle weight that comes with it.
 */
export function Pokenav({ items, ...rest }: PokenavProps) {
  return <NavView {...rest} items={items.map(resolveItem)} />;
}

/**
 * Resolves an item to the sprite the renderer should draw.
 *
 * `spriteUrl` goes through the same normalizer the catalogue path uses rather than being
 * passed through raw. A statically imported image is not necessarily a string — Next hands
 * back `StaticImageData` — and passing the object straight to `src` renders the literal
 * text `[object Object]`. The two paths sharing one normalizer is what stops that bug from
 * being fixed on one side and left standing on the other.
 */
function resolveItem(item: NavItem): NavViewItem {
  const url = toUrl(item.spriteUrl);

  if (url === undefined) warnUnresolved(item);

  return {
    label: item.label,
    href: item.href,
    url,
    // No species name is available here, so the label carries the whole accessible name
    // unless the consumer supplied one.
    alt: item.alt ?? item.label,
  };
}

/**
 * Explains, in development only, why a node came out without a sprite.
 *
 * Worth the code because all three causes render identically — an empty ring — and two of
 * them look exactly like "the image hasn't loaded yet", which is the one explanation that
 * would have you waiting instead of debugging.
 */
function warnUnresolved(item: NavItem): void {
  const what = describeItem(item.label, item.href);

  if (item.spriteUrl !== undefined) {
    warnOnce(
      `${what} has a spriteUrl that could not be read as a URL. Expected a string or an ` +
        `object with a "src" property (what a bundler returns for a static image import), ` +
        `but got ${typeof item.spriteUrl}. The node renders without a sprite.`,
    );
    return;
  }

  if (item.pokemonId !== undefined) {
    warnOnce(
      `${what} sets pokemonId ${item.pokemonId}, but the core "pokenav" entry point does ` +
        `not resolve Pokémon sprites — it ships without the catalogue on purpose. Import ` +
        `{ Pokenav } from "pokenav/pokemon" to use pokemonId, or set spriteUrl instead.`,
    );
    return;
  }

  warnOnce(
    `${what} has neither spriteUrl nor pokemonId, so its node renders without a sprite. ` +
      `Set spriteUrl, or import { Pokenav } from "pokenav/pokemon" and set pokemonId.`,
  );
}
