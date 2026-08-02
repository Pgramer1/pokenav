/**
 * The one sprite import, deliberately kept OUT of the bundled build.
 *
 * This file is published as-is and is never processed by tsup. That is the whole point:
 * esbuild expands `import()` with a dynamic segment into a glob at resolve time, and emits
 * a JS chunk plus a copied PNG for every match — 898 of each — which bloats the package and
 * inlines the lot into the CJS build, where esbuild cannot code-split at all.
 *
 * Left alone, the template literal below is exactly the form Webpack, Vite, Next and
 * Rollup all recognise. Each of them builds a lazy context over `./sprites/*.png` in the
 * CONSUMER's build, where it belongs, so a sprite is fetched only when a nav node asks for
 * it and the package itself stays small.
 *
 * Keep the literal inline. Hoisting the path into a variable makes it unanalyzable to every
 * bundler, not just esbuild, and the sprites stop resolving in production builds.
 */
export function importSprite(pokemonId) {
  return import(`./sprites/${pokemonId}.png`);
}
