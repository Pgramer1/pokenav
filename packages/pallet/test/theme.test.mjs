import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_THEME, resolveTheme } from '../dist/index.js';
import { CSS_GEOMETRY } from '../src/cssGeometry.ts';

/**
 * Theme resolution, checked on the built artifact.
 *
 * `defaults.ts` has runtime imports, so it cannot be loaded through Node's type stripping
 * the way the pure modules can. Reading it from `dist` is the honest alternative and tests
 * the code that actually ships.
 */

test('the default geometry is the stylesheet geometry', () => {
  assert.deepEqual(DEFAULT_THEME.geometry, { ...CSS_GEOMETRY });
  assert.deepEqual(resolveTheme().geometry, { ...CSS_GEOMETRY });
  assert.deepEqual(resolveTheme(undefined).geometry, { ...CSS_GEOMETRY });
});

test('geometry overrides merge field by field', () => {
  const resolved = resolveTheme({ geometry: { gap: 64 } });
  assert.equal(resolved.geometry.gap, 64);
  assert.equal(resolved.geometry.nodeSize, CSS_GEOMETRY.nodeSize);
  assert.equal(resolved.geometry.waveAmplitude, CSS_GEOMETRY.waveAmplitude);
});

test('an explicit undefined does not erase a default', () => {
  const resolved = resolveTheme({ accentColor: undefined, geometry: { gap: undefined } });
  assert.equal(resolved.accentColor, DEFAULT_THEME.accentColor);
  assert.equal(resolved.geometry.gap, CSS_GEOMETRY.gap);
});

test('the rest of the theme still resolves as before', () => {
  const resolved = resolveTheme({ accentColor: '#f97316', trailPath: 'wavy' });
  assert.equal(resolved.accentColor, '#f97316');
  assert.equal(resolved.trailPath, 'wavy');
  assert.equal(resolved.ringStyle, 'solid');
  assert.equal(resolved.surfaceColor, 'Canvas');
  assert.equal(resolved.dotStyle, 'dotted');
  assert.equal(resolved.font, 'inherit');
});

test('resolveTheme does not mutate DEFAULT_THEME', () => {
  resolveTheme({ geometry: { gap: 999 } });
  assert.equal(DEFAULT_THEME.geometry.gap, CSS_GEOMETRY.gap);
});
