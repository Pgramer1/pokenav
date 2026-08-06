'use client';

import { useEffect, useRef, useState } from 'react';
import { loadSprite } from 'pokenav/pokemon';

/**
 * One sprite in the picker grid, loaded only once it is near the viewport.
 *
 * The grid can hold all 898 entries at once. Kicking off 898 dynamic imports on mount
 * would fire 898 chunk requests and make the page useless on a slow connection — the exact
 * problem the lazy sprite API exists to avoid — so each cell waits until it scrolls into
 * range. A single shared IntersectionObserver does the work; one observer per cell would
 * mean 898 of them.
 */
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function observe(element: Element, onVisible: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    onVisible();
    return () => {};
  }

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        observer?.unobserve(entry.target);
        callbacks.delete(entry.target);
      }
    },
    // Start loading a little before the cell is actually on screen.
    { rootMargin: '200px' },
  );

  callbacks.set(element, onVisible);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    callbacks.delete(element);
  };
}

export function SpriteThumb({ pokemonId, name }: { pokemonId: number; name: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let cancelled = false;

    const stop = observe(element, () => {
      void loadSprite(pokemonId).then((resolved) => {
        if (!cancelled && resolved) setUrl(resolved);
      });
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [pokemonId]);

  return (
    <span className="thumb" ref={ref}>
      {url ? <img src={url} alt="" className="thumbImg" /> : <span className="thumbSkeleton" />}
      <span className="thumbName">{name}</span>
    </span>
  );
}
