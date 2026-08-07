import { useEffect, useState } from 'react';
import {
  sectionProgress,
  sectionTopInContent,
  type SectionPosition,
} from './sectionProgress';

export interface SectionProgressOptions {
  /**
   * Distance below the top of the viewport at which a section counts as current.
   *
   * Defaults to the scroll container's computed `scroll-padding-top`, which is the property
   * that already answers this question: it is what a page with a sticky header sets so that
   * clicking an anchor lands the section below the header instead of behind it. Reusing it
   * means the scroll-spy's activation line and the browser's anchor landing point are the
   * same line by construction — get them from different places and a click lands on one
   * section while the nav highlights its neighbour.
   *
   * Pass a number to override, or `0` to activate exactly at the viewport top.
   */
  offset?: number;
  /**
   * Scroll container to track. Defaults to the document.
   *
   * Same reasoning as `useScrollProgress(target)`: the page is the common case, not the
   * only one.
   */
  target?: React.RefObject<HTMLElement | null>;
}

export interface SectionProgress {
  /** The href of the section in view, ready to pass straight to `activeHref`. */
  activeHref: string | undefined;
  /** Progress in section-space, ready to pass straight to `scrollProgress`. */
  scrollProgress: number;
}

/**
 * Scroll-spy for in-page section navigation: which section you are in, and how far through
 * the set of them you are.
 *
 * Returns both values because supplying them from different sources is a bug rather than a
 * choice. `scrollProgress` moves the node highlight via `floor(progress × (stops - 1))`, so
 * a `scrollProgress` measured in document-scroll and an `activeHref` measured in sections
 * disagree on any page whose sections are not all the same height — the highlight sits on
 * one node while `aria-current` sits on another. Here both come out of one reading, so they
 * cannot.
 *
 * ```tsx
 * const sections = ['#intro', '#work', '#contact'];
 * const { activeHref, scrollProgress } = useSectionProgress(sections);
 *
 * <Pokenav
 *   position="left"
 *   orientation="vertical"
 *   items={sections.map((href) => ({ href, label: href.slice(1), spriteUrl: icons[href] }))}
 *   activeHref={activeHref}
 *   scrollProgress={scrollProgress}
 * />;
 * ```
 *
 * Each href identifies its section by fragment — `'#work'` finds `id="work"`. A bare
 * `'work'` works too. Hrefs that match no element are skipped, so a section that has not
 * mounted yet does not shift the ones that have.
 */
export function useSectionProgress(
  hrefs: readonly string[],
  options: SectionProgressOptions = {},
): SectionProgress {
  const { offset, target } = options;
  // Hrefs arrive as a fresh array every render; the joined key is what actually changes.
  const key = hrefs.join(',');

  const [reading, setReading] = useState<SectionProgress>({
    activeHref: hrefs[0],
    scrollProgress: 0,
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const list = key === '' ? [] : key.split(',');
    let frame = 0;

    const read = () => {
      frame = 0;
      const element = target?.current ?? null;
      const scroller = element ?? document.documentElement;

      /*
       * Measured on every read rather than cached on mount. Section tops are not stable:
       * entrance animations, lazily-loaded media, webfonts and collapsible content all move
       * them after first paint, and a cached measurement would leave the nav confidently
       * pointing at the wrong section for the rest of the session. Reading layout here is a
       * forced reflow, which is why the whole thing is already throttled to one call per
       * frame.
       */
      const line = offset ?? scrollPaddingTop(scroller);
      const scrollTop = element ? element.scrollTop : window.scrollY;
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

      const found: Array<{ href: string; position: SectionPosition }> = [];
      // The document's own box is the viewport, so its top is 0; an element's is wherever it
      // currently sits. See sectionTopInContent for why both go through one expression.
      const containerTop = element ? element.getBoundingClientRect().top : 0;

      for (const href of list) {
        const section = findSection(href);
        if (!section) continue;
        const top = sectionTopInContent(
          section.getBoundingClientRect().top,
          containerTop,
          scrollTop,
          line,
        );
        found.push({ href, position: { top } });
      }

      if (found.length === 0) return;

      const { index, progress } = sectionProgress(
        found.map((entry) => entry.position),
        scrollTop,
        maxScroll,
      );

      const activeHref = found[index]?.href;
      setReading((previous) =>
        previous.activeHref === activeHref && previous.scrollProgress === progress
          ? previous
          : { activeHref, scrollProgress: progress },
      );
    };

    // Coalesce to one read per frame; scroll events fire far faster than we can paint.
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    read();

    const source: HTMLElement | Window = target?.current ?? window;
    source.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    /*
     * Sections that change size without a scroll or resize event — an image finishing its
     * load, an accordion opening, a route transition animating in — move every activation
     * line below them. Observing the sections themselves catches what the two window events
     * cannot.
     */
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onScroll);
    if (observer) {
      for (const href of list) {
        const section = findSection(href);
        if (section) observer.observe(section);
      }
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      source.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer?.disconnect();
    };
    // `key` is the stable identity of `hrefs`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset, target]);

  return reading;
}

/** `'#work'`, `'work'` and `'/page#work'` all resolve by the fragment's id. */
function findSection(href: string): HTMLElement | null {
  const hash = href.indexOf('#');
  const id = hash === -1 ? href : href.slice(hash + 1);
  return id === '' ? null : document.getElementById(id);
}

/**
 * The container's `scroll-padding-top` in px, or 0 when it is `auto`/unset.
 *
 * Percentages are resolved against the container's own height, matching how the property is
 * defined, so `scroll-padding-top: 10%` behaves the same for the highlight as it does for
 * an anchor jump.
 */
function scrollPaddingTop(scroller: Element): number {
  const declared = getComputedStyle(scroller).scrollPaddingTop;
  if (declared.endsWith('%')) {
    const percent = Number.parseFloat(declared);
    return Number.isFinite(percent) ? (scroller.clientHeight * percent) / 100 : 0;
  }
  const parsed = Number.parseFloat(declared);
  return Number.isFinite(parsed) ? parsed : 0;
}
