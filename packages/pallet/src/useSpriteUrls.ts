import { useEffect, useState } from 'react';
import { getLoadedSprite, loadSprite } from './sprites';

/**
 * Resolves the sprite URLs for a set of Dex ids, loading each one lazily.
 *
 * Seeded synchronously from the module-level cache so a sprite already resolved elsewhere
 * on the page — another nav, an earlier render, the picker grid — appears immediately
 * rather than flashing back to empty.
 */
export function useSpriteUrls(pokemonIds: readonly number[]): Record<number, string> {
  // Ids arrive as a fresh array every render; the joined key is what actually changes.
  const key = pokemonIds.join(',');
  const [urls, setUrls] = useState<Record<number, string>>(() => seedFromCache(pokemonIds));

  useEffect(() => {
    let cancelled = false;

    const seeded = seedFromCache(pokemonIds);
    if (Object.keys(seeded).length > 0) {
      setUrls((prev) => (containsAll(prev, seeded) ? prev : { ...prev, ...seeded }));
    }

    for (const id of pokemonIds) {
      if (getLoadedSprite(id)) continue;
      void loadSprite(id).then((url) => {
        if (cancelled || !url) return;
        setUrls((prev) => (prev[id] === url ? prev : { ...prev, [id]: url }));
      });
    }

    return () => {
      cancelled = true;
    };
    // `key` is the stable identity of `pokemonIds`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}

function seedFromCache(pokemonIds: readonly number[]): Record<number, string> {
  const seeded: Record<number, string> = {};
  for (const id of pokemonIds) {
    const url = getLoadedSprite(id);
    if (url) seeded[id] = url;
  }
  return seeded;
}

function containsAll(target: Record<number, string>, source: Record<number, string>): boolean {
  return Object.entries(source).every(([id, url]) => target[Number(id)] === url);
}
