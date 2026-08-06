import { getCatalogueEntry } from './catalogue';
import { NavView, type NavViewItem } from './NavView';
import { toUrl } from './toUrl';
import { useSpriteUrls } from './useSpriteUrls';
import { describeItem, warnOnce } from './warn';
import type { CatalogueEntry, NavItem, PokenavProps } from './types';

/**
 * `Pokenav` with Pokémon sprite resolution — the `pokenav/pokemon` entry point.
 *
 * Identical props and identical rendering to the core component; the only difference is
 * that `pokemonId` resolves here. That difference is why it is a separate entry point
 * rather than a flag: the sprite loader's `import()` builds a static context over all 898
 * PNGs in the consumer's bundler, and a static context cannot be gated at runtime. A
 * consumer who never writes `pokemonId` should never have those chunks emitted, and the
 * only way to guarantee that is for their import graph never to reach this module.
 *
 * Resolution happens *above* the renderer rather than inside it, which is what keeps that
 * boundary honest: this component turns `pokemonId` into a plain URL, and hands the
 * renderer exactly what the core entry point hands it.
 */
export function Pokenav({ items, ...rest }: PokenavProps) {
  // Only the ids this nav actually names are ever loaded. `spriteUrl` wins outright, so an
  // item that has one never triggers a sprite fetch.
  const spriteUrls = useSpriteUrls(
    items.map((item) => (item.spriteUrl ? undefined : item.pokemonId)).filter(isNumber),
  );

  return (
    <NavView {...rest} items={items.map((item) => resolveItem(item, spriteUrls))} />
  );
}

/**
 * Resolves an item to the sprite the renderer should draw.
 *
 * `spriteUrl` always wins and bypasses the catalogue entirely — that escape hatch is what
 * makes this a general navigation library rather than a Pokémon-only one (§3).
 *
 * Alt text follows §5: `"{Pokémon name} — {section name}"`, never the species alone. A
 * custom sprite has no species name, so the label carries the whole accessible name. An
 * explicit `alt` overrides both, which is how a config mixing the two paths can still give
 * every node a consistent accessible name.
 */
function resolveItem(item: NavItem, spriteUrls: Record<number, string>): NavViewItem {
  const base = { label: item.label, href: item.href };
  const customUrl = toUrl(item.spriteUrl);

  if (customUrl !== undefined) {
    return { ...base, url: customUrl, alt: item.alt ?? item.label };
  }

  if (item.spriteUrl !== undefined) {
    warnOnce(
      `${describeItem(item.label, item.href)} has a spriteUrl that could not be read as a ` +
        `URL. Expected a string or an object with a "src" property (what a bundler returns ` +
        `for a static image import), but got ${typeof item.spriteUrl}.`,
    );
    return { ...base, url: undefined, alt: item.alt ?? item.label };
  }

  if (item.pokemonId !== undefined) {
    const entry = getCatalogueEntry(item.pokemonId);
    if (!entry) {
      warnOnce(
        `${describeItem(item.label, item.href)} sets pokemonId ${item.pokemonId}, which is ` +
          `not in the bundled catalogue (National Dex ids 1–898; generation 9 has no ` +
          `icon-style sprite upstream). The node renders without a sprite.`,
      );
      return { ...base, url: undefined, alt: item.alt ?? item.label };
    }

    /*
     * A known id with no URL yet is the ordinary loading state, not a failure — the sprite
     * arrives after hydration. Deliberately not warned about: it resolves on its own, and
     * warning would train consumers to ignore the warnings that don't.
     */
    return {
      ...base,
      url: spriteUrls[item.pokemonId],
      alt: item.alt ?? defaultAlt(entry, item.label),
    };
  }

  warnOnce(
    `${describeItem(item.label, item.href)} has neither pokemonId nor spriteUrl, so its ` +
      `node renders without a sprite.`,
  );
  return { ...base, url: undefined, alt: item.alt ?? item.label };
}

function defaultAlt(entry: CatalogueEntry, label: string): string {
  return `${capitalize(entry.name)} — ${label}`;
}

function isNumber(value: number | undefined): value is number {
  return typeof value === 'number';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
