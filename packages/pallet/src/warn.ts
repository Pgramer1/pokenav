/**
 * Development-only warnings.
 *
 * A node whose sprite cannot be resolved still renders — the ring draws and the trail keeps
 * its shape — which is the right runtime behaviour but a terrible debugging experience: a
 * typo'd Dex id, a `spriteUrl` that came back as an object, or `pokemonId` on the core
 * entry point all look identical to "the sprite hasn't loaded yet". These warnings are what
 * make the difference visible while you are building, and they compile out of production.
 */

/**
 * Stripped by every bundler that substitutes `process.env.NODE_ENV`, which turns the whole
 * expression into `false` and lets the warning bodies dead-code eliminate. The `typeof`
 * guard is for the environments that don't substitute it at all — a browser loading the ESM
 * build directly has no `process`, and an unguarded read there would throw.
 */
const IS_PRODUCTION =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

/** Messages already emitted, so a re-rendering tree doesn't bury the console. */
const seen = new Set<string>();

/**
 * Warns once per distinct message, ever.
 *
 * Deduplication is not a nicety here: these are called during render, so without it a
 * component that re-renders on scroll would emit thousands of identical lines, and React's
 * StrictMode double-render would double every one of them.
 */
export function warnOnce(message: string): void {
  if (IS_PRODUCTION) return;
  if (seen.has(message)) return;
  seen.add(message);
  // eslint-disable-next-line no-console
  console.warn(`[pokenav] ${message}`);
}

/** Shared wording for the two entry points' "this sprite went nowhere" cases. */
export function describeItem(label: string, href: string): string {
  return `item ${JSON.stringify(label)} (href ${JSON.stringify(href)})`;
}
