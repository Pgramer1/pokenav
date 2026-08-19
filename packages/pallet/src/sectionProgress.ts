/**
 * The arithmetic behind `useSectionProgress`, kept separate from the DOM wiring so it can be
 * reasoned about and tested as a function of numbers.
 */

export interface SectionPosition {
  /** Scroll offset at which this section becomes current, activation line already applied. */
  top: number;
}

export interface SectionReading {
  /** Index of the section currently in view. */
  index: number;
  /**
   * Progress in **section-space**, 0–1: how far through the list of sections the reader is,
   * not how far down the document.
   */
  progress: number;
}

/**
 * Converts a section's viewport position into the scroll container's content coordinates —
 * the space `scrollTop` is measured in — with the activation line already subtracted.
 *
 * One expression for both the document and an element, because special-casing them is what
 * produced the bug this replaced: the document branch added `scrollTop` back on afterwards,
 * which was right for the document and double-counted it for a container. Every section then
 * appeared to start twice as far down as it really did, so the first one stayed current for
 * the entire scroll.
 *
 * @param sectionTop     `getBoundingClientRect().top` of the section.
 * @param containerTop   `getBoundingClientRect().top` of the scroll container; 0 for the
 *                       document, whose box *is* the viewport.
 * @param scrollTop      Current scroll offset of that container.
 * @param activationLine Distance below the container's top edge at which a section becomes
 *                       current — typically the sticky header's height.
 */
export function sectionTopInContent(
  sectionTop: number,
  containerTop: number,
  scrollTop: number,
  activationLine: number,
): number {
  // Viewport position of the container's content origin: where its content would start if
  // it were scrolled to the top.
  const origin = containerTop - scrollTop;
  return sectionTop - origin - activationLine;
}

/**
 * Where the reader is, in section-space.
 *
 * The distinction from document scroll is the whole point. `reachedNodeIndex` recovers a
 * node from progress with `floor(progress × (stops - 1))`, which assumes every stop occupies
 * an equal share of the range. Raw document progress does not work that way: give one
 * section three times the height of its neighbours and the node highlight sits on the wrong
 * stop for most of the page, with the last sections only lighting up as progress approaches
 * 1. Feeding `scrollProgress` from a nav's own scroll listener and `activeHref` from a
 * scroll-spy therefore produces two answers that disagree for most of a real page.
 *
 * So progress is reported as `(index + fractionThroughSection) / (stops - 1)`, which is
 * exactly the inverse of that floor. Section sizes stop mattering: whatever their heights,
 * `floor(progress × (stops - 1))` returns `index` by construction, and the fill still
 * travels smoothly because the fractional part tracks position within the current section.
 */
export function sectionProgress(
  positions: readonly SectionPosition[],
  scrollTop: number,
  maxScroll: number,
): SectionReading {
  const stops = positions.length;
  if (stops === 0) return { index: -1, progress: 0 };
  if (stops === 1) return { index: 0, progress: 0 };

  /*
   * A short final section may never reach the activation line before the document runs
   * out of scroll range. At the real bottom the reader has nevertheless reached it, so
   * make the final stop unambiguous. A page with no scroll range stays on its first stop:
   * there was no movement from which to infer a later current section.
   */
  if (maxScroll > 0 && scrollTop >= maxScroll) {
    return { index: stops - 1, progress: 1 };
  }

  // The last section whose activation line the reader has crossed. Before the first one,
  // the first section is current — a reader at the top of the page is "in" section one even
  // if its heading has not reached the line yet.
  let index = 0;
  for (let i = 0; i < stops; i += 1) {
    const position = positions[i];
    if (position && scrollTop >= position.top) index = i;
  }

  const start = positions[index]?.top ?? 0;
  /*
   * The end of the current section is the next one's activation line, except for the last
   * section, which ends where scrolling does. Without that fallback the final section would
   * have zero extent and the fill would stick at (stops-2)/(stops-1) forever.
   */
  const end = positions[index + 1]?.top ?? Math.max(maxScroll, start);
  const extent = end - start;

  // A zero or negative extent means two sections share an activation line, or the last
  // section starts past the end of the scroll range. Neither is a reason to divide by zero.
  const fraction = extent > 0 ? clamp01((scrollTop - start) / extent) : 0;

  return { index, progress: clamp01((index + fraction) / (stops - 1)) };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
