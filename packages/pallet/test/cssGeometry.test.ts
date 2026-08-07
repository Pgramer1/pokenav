import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyticGeometry } from '../src/analyticGeometry.ts';
import { CSS_GEOMETRY } from '../src/cssGeometry.ts';

// @ts-expect-error -- plain JS build script, no declarations by design.
import { generate, OUT_PATH } from '../../../scripts/build-css-geometry.mjs';

/*
 * Only modules whose imports are all type-only can be loaded here: these run through Node's
 * type stripping, which does not resolve the extensionless specifiers the rest of `src`
 * uses. Anything with runtime imports — `defaults.ts` and the components — is covered from
 * `dist` in the .mjs tests instead, which has the side benefit of testing what ships.
 */

/**
 * The drift guard.
 *
 * The geometry constants are declared in `pallet.module.css` and mirrored into TypeScript
 * by a build step. Editing the CSS without regenerating would leave the server-rendered
 * curve describing a layout the browser is not producing — which fails silently, as a
 * redraw on first paint rather than an error. This makes it fail loudly instead.
 */
test('cssGeometry.ts is in sync with pallet.module.css', async () => {
  const expected: string = await generate();
  const committed = await readFile(OUT_PATH as string, 'utf8');
  assert.equal(
    committed,
    expected,
    'cssGeometry.ts is stale — run `node scripts/build-css-geometry.mjs`',
  );
});

test('the generated constants are the values the stylesheet declares', async () => {
  const css = await readFile(
    new URL('../src/pallet.module.css', import.meta.url),
    'utf8',
  );
  // Read independently of the generator, so a bug in the generator cannot validate itself.
  assert.match(css, new RegExp(`--pallet-node-size:\\s*${CSS_GEOMETRY.nodeSize}px`));
  assert.match(css, new RegExp(`--pallet-wave-amplitude:\\s*${CSS_GEOMETRY.waveAmplitude}px`));
  // The gap is authored in rem against a 16px root.
  assert.match(css, new RegExp(`--pallet-gap:\\s*${CSS_GEOMETRY.gap / 16}rem`));
});

test('the computed path uses the resolved geometry, not the defaults', () => {
  const geometry = { ...CSS_GEOMETRY, gap: 64 };
  const trail = analyticGeometry(3, 'vertical', geometry);
  assert.ok(trail);

  const pitch = CSS_GEOMETRY.nodeSize + 64;
  assert.equal(trail.points[1]!.y - trail.points[0]!.y, pitch);
  assert.equal(trail.height, 3 * CSS_GEOMETRY.nodeSize + 2 * 64);
  assert.equal(trail.amplitude, CSS_GEOMETRY.waveAmplitude);
});

test('horizontal geometry is the vertical one transposed', () => {
  const geometry = { ...CSS_GEOMETRY };
  const v = analyticGeometry(4, 'vertical', geometry)!;
  const h = analyticGeometry(4, 'horizontal', geometry)!;
  assert.equal(v.width, h.height);
  assert.equal(v.height, h.width);
  assert.deepEqual(
    v.points.map((p) => p.y),
    h.points.map((p) => p.x),
  );
});

test('fewer than two nodes has no trail to draw', () => {
  const geometry = { ...CSS_GEOMETRY };
  assert.equal(analyticGeometry(0, 'vertical', geometry), null);
  assert.equal(analyticGeometry(1, 'vertical', geometry), null);
});
