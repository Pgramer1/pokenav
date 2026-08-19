import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';

import { Pokenav } from '../dist/index.js';
import { Pokenav as PokemonPokenav } from '../dist/pokemon.js';

const item = (index) => ({
  label: `Item ${index}`,
  href: `/item-${index}`,
  spriteUrl: `/sprite-${index}.png`,
});

function render(Component = Pokenav, props = {}) {
  const html = renderToStaticMarkup(
    h(Component, {
      position: 'left',
      orientation: 'vertical',
      items: [],
      ...props,
    }),
  );
  return new JSDOM(`<!doctype html><body>${html}</body>`, {
    url: 'https://example.test/',
  }).window.document;
}

test('renders empty, single, multiple, and large item lists', () => {
  for (const count of [0, 1, 4, 125]) {
    const document = render(Pokenav, {
      items: Array.from({ length: count }, (_, index) => item(index)),
    });
    assert.equal(document.querySelectorAll('[data-pallet-node]').length, count);
    assert.equal(document.querySelectorAll('a').length, count);
  }
});

test('optional root props have documented defaults and accept overrides', () => {
  const defaults = render(Pokenav, { items: [item(0)] }).querySelector('nav');
  assert.ok(defaults);
  assert.equal(defaults.getAttribute('aria-label'), 'Site navigation');

  const custom = render(Pokenav, {
    items: [item(0)],
    ariaLabel: 'Chapter navigation',
    className: 'consumer-class',
  }).querySelector('nav');
  assert.ok(custom);
  assert.equal(custom.getAttribute('aria-label'), 'Chapter navigation');
  assert.ok(custom.classList.contains('consumer-class'));
});

test('all orientation and position combinations reach the rendered contract', () => {
  for (const orientation of ['vertical', 'horizontal']) {
    for (const position of ['left', 'center', 'right']) {
      const nav = render(Pokenav, {
        orientation,
        position,
        items: [item(0), item(1)],
      }).querySelector('nav');
      assert.ok(nav);
      assert.equal(nav.dataset.orientation, orientation);
      assert.equal(nav.dataset.position, position);
    }
  }
});

test('straight and wavy trails expose the correct rendered layers', () => {
  const straight = render(Pokenav, { items: [item(0), item(1)] });
  assert.equal(straight.querySelector('[data-pallet-trail-svg]'), null);
  assert.equal(straight.querySelector('nav')?.dataset.trailPath, 'straight');

  const wavy = render(Pokenav, {
    items: [item(0), item(1)],
    theme: { trailPath: 'wavy' },
  });
  assert.ok(wavy.querySelector('[data-pallet-trail-svg]'));
  assert.equal(wavy.querySelector('nav')?.dataset.trailPath, 'wavy');
});

test('no, partial, and full scroll progress select the expected reached node', () => {
  const items = [item(0), item(1), item(2), item(3)];
  const without = render(Pokenav, { items });
  assert.equal(without.querySelector('[data-scroll-fill]'), null);
  assert.equal(without.querySelector('[data-reached]'), null);

  const partial = render(Pokenav, { items, scrollProgress: 0.4 });
  assert.equal(partial.querySelectorAll('[data-reached]').length, 1);
  assert.equal(partial.querySelector('[data-reached] a')?.getAttribute('href'), '/item-1');

  const full = render(Pokenav, { items, scrollProgress: 1 });
  assert.equal(full.querySelector('[data-reached] a')?.getAttribute('href'), '/item-3');
  assert.equal(full.querySelector('[aria-current]')?.getAttribute('href'), '/item-3');
});

test('landmark, links, accessible names, and keyboard focus use native semantics', () => {
  const document = render(Pokenav, {
    ariaLabel: 'Sections',
    activeHref: '#work',
    items: [
      { label: 'Intro', href: '#intro', spriteUrl: '/intro.png', alt: '' },
      { label: 'Work', href: '#work', spriteUrl: '/work.png', alt: 'Portfolio artwork' },
    ],
  });

  const nav = document.querySelector('nav[aria-label="Sections"]');
  const links = [...document.querySelectorAll('a')];
  assert.ok(nav);
  assert.equal(links.length, 2);
  assert.equal(links[0].tabIndex, 0);
  assert.equal(links[1].getAttribute('aria-current'), 'location');
  assert.equal(links[0].querySelector('[data-pallet-label]')?.getAttribute('aria-hidden'), null);
  assert.equal(links[1].querySelector('[data-pallet-label]')?.getAttribute('aria-hidden'), 'true');

  links[0].focus();
  assert.equal(document.activeElement, links[0]);
});

test('core sprite handling supports strings, image objects, and missing sprites', () => {
  const document = render(Pokenav, {
    items: [
      { label: 'String', href: '/string', spriteUrl: '/string.png' },
      { label: 'Object', href: '/object', spriteUrl: { src: '/object.png' } },
      { label: 'Missing', href: '/missing' },
    ],
  });
  const images = [...document.querySelectorAll('img')];
  assert.deepEqual(
    images.map((image) => new URL(image.src).pathname),
    ['/string.png', '/object.png'],
  );
  assert.equal(document.querySelector('a[href="/missing"] img'), null);
  assert.equal(
    document.querySelector('a[href="/missing"] [data-pallet-label]')?.getAttribute('aria-hidden'),
    null,
  );
});

test('Pokémon entry accepts ids while a custom URL still wins during SSR', () => {
  const document = render(PokemonPokenav, {
    items: [
      { label: 'Eevee', href: '/eevee', pokemonId: 133 },
      {
        label: 'Custom',
        href: '/custom',
        pokemonId: 25,
        spriteUrl: '/custom.png',
      },
    ],
  });

  // Catalogue sprites intentionally resolve after hydration; custom URLs server-render.
  assert.equal(document.querySelector('a[href="/eevee"] img'), null);
  assert.equal(
    new URL(document.querySelector('a[href="/custom"] img')?.src ?? '', 'https://example.test')
      .pathname,
    '/custom.png',
  );
});
