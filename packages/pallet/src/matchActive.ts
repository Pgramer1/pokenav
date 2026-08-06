import type { MatchActive } from './types';

/**
 * Decides whether an item is the active one.
 *
 * `exact` is the default and stays a plain string comparison, exactly as every version
 * before 0.2 behaved — a config that never sets `matchActive` cannot change behaviour.
 */
export function isItemActive(
  itemHref: string,
  activeHref: string | undefined,
  matchActive: MatchActive | undefined,
): boolean {
  if (activeHref === undefined) return false;
  if (typeof matchActive === 'function') return matchActive(itemHref, activeHref);
  if (matchActive === 'prefix') return matchesPrefix(itemHref, activeHref);
  return itemHref === activeHref;
}

/**
 * Prefix matching that survives the cases a naive `startsWith` gets wrong.
 *
 * Three of them, all of which show up on a real site:
 *
 * - **Root.** `'/'.startsWith` is a prefix of every route, so a plain prefix test lights up
 *   the Home node on every page and the nav never appears to change. A root href therefore
 *   matches only itself.
 * - **Segment boundaries.** `/blogroll` starts with `/blog`, but it is not nested under it.
 *   Requiring the following character to be a separator is what distinguishes "inside this
 *   section" from "happens to share a spelling".
 * - **Trailing slashes, queries and hashes.** `/blog/`, `/blog?page=2` and `/blog#top` are
 *   all the `/blog` route as far as a nav is concerned. Comparing raw strings would drop
 *   the highlight the moment a query string appeared, which is a confusing way to fail.
 */
function matchesPrefix(itemHref: string, activeHref: string): boolean {
  const item = normalizePath(itemHref);
  const active = normalizePath(activeHref);

  if (item === active) return true;
  // A root href is a prefix of everything; treated as prefix it would pin the highlight to
  // the Home node forever.
  if (item === '') return false;
  // The separator is what stops `/blog` claiming `/blogroll`.
  return active.startsWith(`${item}/`);
}

/** Drops any query or hash, then any trailing slash, so `/blog/` and `/blog` are one route. */
function normalizePath(href: string): string {
  const end = firstIndexOf(href, '?', '#');
  const path = end === -1 ? href : href.slice(0, end);
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function firstIndexOf(value: string, ...needles: string[]): number {
  let found = -1;
  for (const needle of needles) {
    const index = value.indexOf(needle);
    if (index !== -1 && (found === -1 || index < found)) found = index;
  }
  return found;
}
