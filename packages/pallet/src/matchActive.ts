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
 * Whether an href addresses a position within the current document rather than a route.
 *
 * `#work` yes, `/work#intro` no — the second one navigates. This is the same question
 * `aria-current` needs answered (`location` vs `page`), so it lives here next to the
 * matching rules rather than being re-derived at the call site.
 */
export function isFragmentOnly(href: string): boolean {
  return href.startsWith('#');
}

/**
 * The `aria-current` token for an item that is the current one.
 *
 * `page` means "the current page within a set of pages", which is wrong for an in-page
 * section nav — every one of those links stays on the same page. `location` is the token
 * for "the current location within an environment", which is exactly what a section
 * anchor marks. The href already says which kind of link it is, so nothing needs
 * configuring.
 */
export function ariaCurrentToken(href: string): 'page' | 'location' {
  return isFragmentOnly(href) ? 'location' : 'page';
}

/**
 * Prefix matching that survives the cases a naive `startsWith` gets wrong.
 *
 * Four of them, all of which show up on a real site:
 *
 * - **Hrefs with no path at all.** `#work` and `?page=2` carry their whole identity outside
 *   the path, and every one of them has the *same* (empty) path. Prefix logic run over that
 *   path makes every in-page anchor equivalent to every other, so a section nav lights up
 *   completely and stays that way. There is no hierarchy in a fragment to nest under
 *   either, so exact equality is the only sound answer for them — and it has to be checked
 *   before the path comparison, not after, because the path comparison is what conflates
 *   them.
 * - **Root.** `/` is a path-prefix of every route, so a plain prefix test lights up the Home
 *   node on every page and the nav never appears to change. A root href matches only the
 *   root route. Note that `/` is *not* the case above: it has a path, it is just an empty
 *   one once the trailing slash is trimmed, which is why the two need separate handling.
 * - **Segment boundaries.** `/blogroll` starts with `/blog`, but it is not nested under it.
 *   Requiring the following character to be a separator is what distinguishes "inside this
 *   section" from "happens to share a spelling".
 * - **Trailing slashes, queries and hashes.** `/blog/`, `/blog?page=2` and `/blog#top` are
 *   all the `/blog` route as far as a nav is concerned. Comparing raw strings would drop
 *   the highlight the moment a query string appeared, which is a confusing way to fail.
 */
function matchesPrefix(itemHref: string, activeHref: string): boolean {
  // Checked first, and on the raw strings, for the reason in the doc comment above: once
  // either side has been reduced to its path there is no longer anything to tell these
  // hrefs apart.
  if (!hasPath(itemHref) || !hasPath(activeHref)) return itemHref === activeHref;

  const item = trimTrailingSlash(pathOf(itemHref));
  const active = trimTrailingSlash(pathOf(activeHref));

  if (item === active) return true;
  // A root href is a path-prefix of everything; treated as one it would pin the highlight
  // to the Home node forever.
  if (item === '') return false;
  // The separator is what stops `/blog` claiming `/blogroll`.
  return active.startsWith(`${item}/`);
}

/**
 * Whether an href has a path component at all.
 *
 * Deliberately checked *before* the trailing slash is trimmed, because that is the only
 * thing separating `/` (path `"/"`, a real route) from `#work` and `?page=2` (path `""`,
 * no route). Trim first and the three become indistinguishable.
 */
function hasPath(href: string): boolean {
  return pathOf(href) !== '';
}

/** Everything before the first `?` or `#`. */
function pathOf(href: string): string {
  const end = firstIndexOf(href, '?', '#');
  return end === -1 ? href : href.slice(0, end);
}

/** So `/blog/` and `/blog` are one route. */
function trimTrailingSlash(path: string): string {
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
