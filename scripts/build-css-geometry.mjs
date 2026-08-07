/**
 * Generates `packages/pallet/src/cssGeometry.ts` from the stylesheet's own defaults.
 *
 * The wavy trail is computed before layout exists so it can be server-rendered, and that
 * computation needs node size, gap and wave amplitude — three values that are *declared* in
 * `pallet.module.css` and were previously *re-declared* as literals in `analyticGeometry.ts`.
 * Two copies of a number that must agree is a drift bug waiting to happen: change the CSS
 * and the server-rendered curve silently starts describing a layout the browser is not
 * producing, which shows up as a redraw on first paint rather than as an error.
 *
 * The CSS stays hand-authored and authoritative; this only mirrors it into TypeScript. Same
 * arrangement as `build-catalogue.mjs` — generated file, never hand-edited.
 *
 * Run by `npm run build` before tsup. `npm test` regenerates in memory and fails if the
 * committed file disagrees, so drift cannot survive a test run either.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_PATH = path.join(ROOT, 'packages/pallet/src/pallet.module.css');
const OUT_PATH = path.join(ROOT, 'packages/pallet/src/cssGeometry.ts');

/**
 * The properties the geometry computation needs, mapped to the field names it uses.
 *
 * Only these three. Everything else in the defaults block is a colour, a duration or a ring
 * thickness — none of which the path calculation reads, so mirroring them would be dead
 * weight that still has to be kept in sync.
 */
const WANTED = {
  '--pallet-node-size': 'nodeSize',
  '--pallet-gap': 'gap',
  '--pallet-wave-amplitude': 'waveAmplitude',
};

/**
 * `rem` is resolved against 16px, the initial value of `font-size` on the root element.
 *
 * This is the one number here that the stylesheet cannot settle on its own: a consumer with
 * a different root font size genuinely has a different gap, and no build step can know it.
 * That case is what the measurement pass exists to correct, and what `theme.geometry`
 * exists to pre-empt.
 */
const ROOT_FONT_SIZE = 16;

/** Reads the declarations out of the `:where(.nav)` defaults block. */
export function parseGeometry(css) {
  const block = /:where\(\.nav\)\s*\{([\s\S]*?)\}/.exec(css);
  if (!block?.[1]) {
    throw new Error('Could not find the `:where(.nav)` defaults block in pallet.module.css');
  }

  const geometry = {};
  for (const [property, field] of Object.entries(WANTED)) {
    const declaration = new RegExp(`${property}\\s*:\\s*([^;]+);`).exec(block[1]);
    if (!declaration?.[1]) {
      throw new Error(`\`${property}\` is missing from the :where(.nav) defaults block`);
    }
    geometry[field] = toPx(declaration[1].trim(), property);
  }
  return geometry;
}

function toPx(value, property) {
  const match = /^(-?[\d.]+)(px|rem)$/.exec(value);
  if (!match) {
    throw new Error(
      `\`${property}: ${value}\` is not a plain px or rem length. The geometry computation ` +
        `needs a number it can do arithmetic on, so this generator deliberately refuses ` +
        `calc(), var() and unitless values rather than guessing.`,
    );
  }
  const number = Number.parseFloat(match[1]);
  return match[2] === 'rem' ? number * ROOT_FONT_SIZE : number;
}

export function renderModule(geometry) {
  return `/**
 * GENERATED FILE — do not edit.
 *
 * Mirrors the geometry custom properties declared in \`src/pallet.module.css\` so the wavy
 * trail can be computed before any layout read. Regenerate with \`npm run build\` (or
 * \`node scripts/build-css-geometry.mjs\`); \`npm test\` fails if this drifts from the CSS.
 *
 * \`--pallet-gap\` is declared in \`rem\` and resolved here against a ${ROOT_FONT_SIZE}px root font
 * size. A consumer who changes their root font size has a different real gap, which
 * measurement corrects at hydration and \`theme.geometry\` avoids up front.
 */

/** Default node geometry, in CSS pixels. */
export const CSS_GEOMETRY = {
  /** \`--pallet-node-size\` */
  nodeSize: ${geometry.nodeSize},
  /** \`--pallet-gap\` */
  gap: ${geometry.gap},
  /** \`--pallet-wave-amplitude\` */
  waveAmplitude: ${geometry.waveAmplitude},
} as const;
`;
}

export async function generate() {
  const css = await readFile(CSS_PATH, 'utf8');
  return renderModule(parseGeometry(css));
}

// Only write when run directly, so the test can import the pure pieces above.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const contents = await generate();
  const existing = await readFile(OUT_PATH, 'utf8').catch(() => null);
  if (existing === contents) {
    console.log('cssGeometry.ts is up to date');
  } else {
    await writeFile(OUT_PATH, contents);
    console.log(`wrote ${path.relative(ROOT, OUT_PATH)}`);
  }
}

export { CSS_PATH, OUT_PATH };
