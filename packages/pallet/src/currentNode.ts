/**
 * Which node is the current one — the single answer that both the highlight and
 * `aria-current` are read from.
 *
 * These used to be two independent computations: the visual emphasis followed
 * `reachedNodeIndex(scrollProgress)` while `aria-current` followed `isItemActive(activeHref)`.
 * With `scrollProgress` set they disagree the moment the fill passes the first node, so a
 * screen reader announced one stop while the page showed another. Splitting the rule across
 * two call sites is what allowed that, so there is now one function and both consumers read
 * its result.
 */

/**
 * Index of the last node the trail fill has actually arrived at, or -1 when scroll fill is
 * not in use.
 *
 * Deliberately `floor` rather than `round`: the glow marks where the trail *has reached*,
 * so it should not jump to a node the fill is still travelling toward. At 80% of the way to
 * the next node, the previous one is still the one the trail has got to.
 *
 * `useSectionProgress` is built to invert exactly this expression — it reports progress in
 * section-space so that this floor recovers the section index it started from.
 */
export function reachedNodeIndex(progress: number | undefined, count: number): number {
  if (progress === undefined || !Number.isFinite(progress) || count < 1) return -1;
  const clamped = Math.min(1, Math.max(0, progress));
  const segments = Math.max(count - 1, 1);
  // The epsilon absorbs float error at exactly 1.0 so the final node still lights up.
  return Math.min(count - 1, Math.floor(clamped * segments + 1e-9));
}

/**
 * The one node that is current, or -1 for none.
 *
 * Scroll fill wins when the consumer is driving it, because that is what the trail is
 * visibly pointing at — the fill travels, and the node it has reached is the one a reader
 * is actually on. Without it, the route decides.
 *
 * When several items match (`matchActive: 'prefix'` over nested routes such as `/blog` and
 * `/blog/archive`), the **longest** matching href wins. All of them are legitimately
 * "active" and keep `data-active`, but only the most specific one can be *the* current
 * location, and picking the first in document order would hand it to the broadest match.
 */
export function currentNodeIndex(
  hrefs: readonly string[],
  activeFlags: readonly boolean[],
  reachedIndex: number,
  hasScrollFill: boolean,
): number {
  if (hasScrollFill) return reachedIndex;

  let best = -1;
  for (let i = 0; i < activeFlags.length; i += 1) {
    if (!activeFlags[i]) continue;
    if (best === -1 || (hrefs[i]?.length ?? 0) > (hrefs[best]?.length ?? 0)) best = i;
  }
  return best;
}
