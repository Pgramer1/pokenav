import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement as h } from 'react';

import { Pokenav } from '../dist/index.js';

/**
 * Rendered-output tests, run against `dist/` rather than `src/`.
 *
 * The acceptance criteria for these fixes are all phrased in terms of what the markup says —
 * which node carries `aria-current`, which carries the highlight — so that is what gets
 * asserted, on the artifact that actually ships.
 */

/**
 * Per-node facts.
 *
 * Split on `<li ` with the trailing space: React 19 emits a `<link rel="preload">` for each
 * image ahead of the nav, and `<link` contains the substring `<li`.
 */
function nodes(html) {
  return html
    .split('<li ')
    .slice(1)
    .map((li) => ({
      href: /<a href="([^"]*)"/.exec(li)?.[1],
      ariaCurrent: /aria-current="([^"]*)"/.exec(li)?.[1],
      active: li.includes('data-active=""'),
      reached: li.includes('data-reached=""'),
      current: li.includes('data-current=""'),
    }));
}

function render(props) {
  return nodes(
    renderToStaticMarkup(
      h(Pokenav, { position: 'left', orientation: 'vertical', ...props }),
    ),
  );
}

const item = (href) => ({ label: href, href, spriteUrl: '/x.png' });
const PAGES = ['/', '/blog', '/uses', '/contact'].map(item);
const SECTIONS = ['#intro', '#work', '#writing'].map(item);

test('exactly one node is current, and it is the matched route', () => {
  const rendered = render({ items: PAGES, activeHref: '/blog' });
  assert.deepEqual(
    rendered.map((n) => n.current),
    [false, true, false, false],
  );
  assert.equal(rendered.filter((n) => n.ariaCurrent !== undefined).length, 1);
});

test('no activeHref and no scrollProgress means no current node', () => {
  const rendered = render({ items: PAGES });
  assert.equal(rendered.filter((n) => n.current).length, 0);
  assert.equal(rendered.filter((n) => n.ariaCurrent !== undefined).length, 0);
});

/*
 * The divergence bug. `aria-current` followed the route while the highlight followed the
 * fill, so from the moment the fill passed the first node a screen reader announced one
 * stop and the page showed another.
 */
test('aria-current and the highlight agree at every scroll position', () => {
  for (let progress = 0; progress <= 1.0001; progress += 0.02) {
    const rendered = render({
      items: PAGES,
      activeHref: '/',
      scrollProgress: Math.min(progress, 1),
    });

    const withAria = rendered.filter((n) => n.ariaCurrent !== undefined);
    const withCurrent = rendered.filter((n) => n.current);
    const withReached = rendered.filter((n) => n.reached);

    assert.equal(withAria.length, 1, `progress ${progress}: expected exactly one aria-current`);
    assert.equal(withCurrent.length, 1, `progress ${progress}: expected exactly one current`);

    assert.equal(
      rendered.indexOf(withAria[0]),
      rendered.indexOf(withCurrent[0]),
      `progress ${progress}: aria-current and data-current on different nodes`,
    );
    assert.equal(
      rendered.indexOf(withCurrent[0]),
      rendered.indexOf(withReached[0]),
      `progress ${progress}: highlight is not on the reached node`,
    );
  }
});

test('the current node advances through every stop as progress rises', () => {
  const seen = new Set();
  for (let progress = 0; progress <= 1.0001; progress += 0.01) {
    const rendered = render({
      items: PAGES,
      activeHref: '/',
      scrollProgress: Math.min(progress, 1),
    });
    seen.add(rendered.findIndex((n) => n.current));
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3], 'every node should be current at some point');
});

test('data-active still reports the route, independently of the highlight', () => {
  const rendered = render({ items: PAGES, activeHref: '/uses', scrollProgress: 0 });
  // The route is still exposed for styling…
  assert.deepEqual(
    rendered.map((n) => n.active),
    [false, false, true, false],
  );
  // …while the highlight is where the fill has reached.
  assert.equal(rendered.findIndex((n) => n.current), 0);
});

test('fragment-only items get aria-current="location"', () => {
  const rendered = render({ items: SECTIONS, activeHref: '#work' });
  const current = rendered.find((n) => n.current);
  assert.equal(current.href, '#work');
  assert.equal(current.ariaCurrent, 'location');
});

test('path items get aria-current="page"', () => {
  const rendered = render({ items: PAGES, activeHref: '/blog' });
  assert.equal(rendered.find((n) => n.current).ariaCurrent, 'page');
});

test('a section nav under prefix matching lights exactly one node', () => {
  const rendered = render({ items: SECTIONS, activeHref: '#work', matchActive: 'prefix' });
  assert.deepEqual(
    rendered.map((n) => n.active),
    [false, true, false],
  );
  assert.equal(rendered.filter((n) => n.current).length, 1);
});

test('with nested routes matching, the most specific one is current', () => {
  const rendered = render({
    items: ['/', '/blog', '/blog/archive'].map(item),
    activeHref: '/blog/archive/2024',
    matchActive: 'prefix',
  });
  // Both /blog and /blog/archive legitimately match…
  assert.deepEqual(
    rendered.map((n) => n.active),
    [false, true, true],
  );
  // …but only the deepest is the current location.
  assert.deepEqual(
    rendered.map((n) => n.current),
    [false, false, true],
  );
});

/*
 * Item 4's acceptance: a geometry override must produce a server-rendered path that already
 * matches the final layout, instead of one the browser corrects on first paint.
 */
test('theme.geometry reaches both the computed path and the inline custom properties', () => {
  const html = renderToStaticMarkup(
    h(Pokenav, {
      position: 'left',
      orientation: 'vertical',
      items: PAGES,
      theme: { trailPath: 'wavy', geometry: { gap: 64 } },
    }),
  );

  // The stylesheet is told about the override…
  assert.match(html, /--pallet-gap:64px/);
  // …and the path is drawn at the matching pitch: 4 nodes at 64 + 64 = 128px apart.
  const d = /<path[^>]*d="(M [^"]*)"/.exec(html)?.[1];
  assert.ok(d, 'expected a server-rendered wavy path');
  const ys = [...d.matchAll(/(?:M|,) (?:-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[1]));
  assert.equal(ys[0], 32);
  assert.match(d, /32 160/, 'second node should sit 128px below the first');
  // 4 nodes at 64px + 3 gaps at 64px.
  assert.match(html, /height="448"/);
});

test('without theme.geometry no geometry custom properties are emitted', () => {
  const html = renderToStaticMarkup(
    h(Pokenav, { position: 'left', orientation: 'vertical', items: PAGES }),
  );
  // Emitting them inline would outrank a consumer's own stylesheet override.
  assert.doesNotMatch(html, /--pallet-gap/);
  assert.doesNotMatch(html, /--pallet-node-size/);
});
