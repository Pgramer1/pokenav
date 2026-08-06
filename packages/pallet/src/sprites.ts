/**
 * Lazy sprite loading, keyed by National Dex id.
 *
 * The catalogue bundles 898 sprites. Statically importing them into one lookup object
 * would inline every sprite into the package's main chunk and ship all of them to every
 * consumer regardless of which handful their NavConfig actually names — so the import is
 * dynamic and per sprite, resolved only when a node asks for one.
 *
 * The import itself lives in `sprite-import.mjs`, which is published unbundled; see that
 * file for why it cannot live here. See PALLET-PLAN.md §7 for what this buys, measured.
 */
import { importSprite } from '../sprite-import.mjs';
import { toUrl } from './toUrl';

/** Resolved sprite URLs, so a sprite is only ever fetched once per page. */
const cache = new Map<number, string>();

/** Ids known to have no sprite, so a miss is not retried on every render. */
const misses = new Set<number>();

/** In-flight loads, so concurrent nodes asking for the same sprite share one import. */
const inFlight = new Map<number, Promise<string | undefined>>();

/** Synchronous read of an already-resolved sprite. Used to avoid a flash on re-render. */
export function getLoadedSprite(pokemonId: number): string | undefined {
  return cache.get(pokemonId);
}

/**
 * Resolves the sprite URL for a Dex id, importing it on first use.
 *
 * The template literal is deliberate: bundlers turn `import()` with a dynamic segment into
 * a context over the matching directory, which is what keeps each sprite in its own chunk
 * instead of the main one. Returns undefined for ids with no bundled sprite, so callers can
 * fall back rather than render a broken image.
 */
export function loadSprite(pokemonId: number): Promise<string | undefined> {
  const cached = cache.get(pokemonId);
  if (cached) return Promise.resolve(cached);
  if (misses.has(pokemonId)) return Promise.resolve(undefined);

  const existing = inFlight.get(pokemonId);
  if (existing) return existing;

  const pending = importSprite(pokemonId)
    .then((module: unknown) => {
      const url = toUrl(module);
      if (url === undefined) {
        misses.add(pokemonId);
        return undefined;
      }
      cache.set(pokemonId, url);
      return url;
    })
    .catch(() => {
      misses.add(pokemonId);
      return undefined;
    })
    .finally(() => {
      inFlight.delete(pokemonId);
    });

  inFlight.set(pokemonId, pending);
  return pending;
}
