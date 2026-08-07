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
 * Whether an environment counts as development, given whatever `NODE_ENV` turned out to be.
 *
 * The rule is **opt in, not opt out**: warnings run only where the environment positively
 * says it is not production. Anything undetermined — `NODE_ENV` unset, or no `process` at
 * all — is treated as production and stays quiet.
 *
 * That direction matters more than it looks. `process` is absent in a browser loading the
 * ESM build straight from a CDN, in some edge runtimes, and in workers, and none of those
 * are development. Testing for *production* and defaulting the unknown case to development
 * inverts the risk: it makes the failure mode "a library shouts diagnostics at real users",
 * which is the one that is both worse and harder to notice, since it never happens on the
 * machine of whoever wrote the check.
 */
export function isDevelopmentEnv(nodeEnv: string | undefined): boolean {
  return nodeEnv !== undefined && nodeEnv !== 'production';
}

/**
 * Read once at module scope so bundlers can substitute `process.env.NODE_ENV` and fold this
 * to a constant, leaving the warning bodies unreachable in production builds. The `typeof`
 * guard is what keeps an unguarded read from throwing where `process` does not exist.
 */
const IS_DEVELOPMENT = isDevelopmentEnv(
  typeof process === 'undefined' ? undefined : process.env?.NODE_ENV,
);

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
  if (!IS_DEVELOPMENT) return;
  if (seen.has(message)) return;
  seen.add(message);
  // eslint-disable-next-line no-console
  console.warn(`[pokenav] ${message}`);
}

/** Shared wording for the two entry points' "this sprite went nowhere" cases. */
export function describeItem(label: string, href: string): string {
  return `item ${JSON.stringify(label)} (href ${JSON.stringify(href)})`;
}
