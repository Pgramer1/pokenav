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
 * `sprite-import.mjs` is published unbundled rather than compiled, so it has no generated
 * types — see the file itself for why it has to stay outside the build.
 */
declare module '*/sprite-import.mjs' {
  export function importSprite(
    pokemonId: number,
  ): Promise<{ default?: string } | string>;
}
