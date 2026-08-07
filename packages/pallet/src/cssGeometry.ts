/**
 * GENERATED FILE — do not edit.
 *
 * Mirrors the geometry custom properties declared in `src/pallet.module.css` so the wavy
 * trail can be computed before any layout read. Regenerate with `npm run build` (or
 * `node scripts/build-css-geometry.mjs`); `npm test` fails if this drifts from the CSS.
 *
 * `--pallet-gap` is declared in `rem` and resolved here against a 16px root font
 * size. A consumer who changes their root font size has a different real gap, which
 * measurement corrects at hydration and `theme.geometry` avoids up front.
 */

/** Default node geometry, in CSS pixels. */
export const CSS_GEOMETRY = {
  /** `--pallet-node-size` */
  nodeSize: 64,
  /** `--pallet-gap` */
  gap: 28,
  /** `--pallet-wave-amplitude` */
  waveAmplitude: 12,
} as const;
