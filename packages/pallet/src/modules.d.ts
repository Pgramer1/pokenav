/** Ambient declarations for the non-TS assets tsup bundles into the package. */

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Sprite PNGs are resolved by the consumer's bundler, which returns a URL string (or a
 * module whose default export is one).
 */
declare module '*.png' {
  const src: string;
  export default src;
}

/**
 * The one field of `process` the dev-warning guard reads.
 *
 * Declared here rather than by adding `@types/node`: this is a browser-facing package, and
 * pulling the whole Node global surface into scope so that one property resolves would
 * make `Buffer`, `__dirname` and friends typecheck in code that cannot use them. Declared
 * as possibly-undefined because it genuinely is — the ESM build can be loaded straight into
 * a browser, which is why the guard tests `typeof process` before reading it.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

/**
 * `sprite-import.mjs` is published unbundled rather than compiled, so it has no generated
 * types — see the file itself for why it has to stay outside the build.
 */
declare module '*/sprite-import.mjs' {
  export function importSprite(
    pokemonId: number,
  ): Promise<{ default?: string } | string>;
}
