'use client';

import { useEffect, useState } from 'react';

export const SECTIONS = [
  { id: 'install', label: 'Install' },
  { id: 'minimal', label: 'Minimal example' },
  { id: 'entry-points', label: 'Two entry points' },
  { id: 'reference', label: 'NavConfig reference' },
  { id: 'centered', label: 'Centered horizontal nav' },
  { id: 'matching', label: 'Active route matching' },
  { id: 'fixed-rail', label: 'Fixed rail' },
  { id: 'playground', label: 'Pick sprites visually' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'licensing', label: 'Sprite licensing' },
];

/**
 * "On this page" rail with scroll-spy.
 *
 * Position is derived from a rAF-throttled scroll read rather than IntersectionObserver:
 * the rule here is "the last heading whose top has passed under the header", which is a
 * comparison across all headings at once. An observer only reports the ones that happen to
 * be intersecting, so a section taller than the viewport — the reference tables, easily —
 * would leave it with nothing to report and the highlight would stall.
 */
export function Toc() {
  const [active, setActive] = useState(SECTIONS[0]?.id ?? '');

  useEffect(() => {
    const headings = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const first = headings[0];
    const last = headings[headings.length - 1];
    if (!first || !last) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      // Clears the sticky header, so a heading counts as "current" once it is actually
      // readable rather than while still tucked behind the bar.
      const offset = 110;
      let current = first.id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - offset <= 0) current = heading.id;
      }
      // The last section is often shorter than the viewport, so its heading never reaches
      // the line. Bottoming out the page should still select it.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = last.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <nav className="toc" aria-label="On this page">
      <span className="tocTitle">On this page</span>
      <ul>
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="tocLink"
              data-current={active === section.id ? '' : undefined}
              aria-current={active === section.id ? 'true' : undefined}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
