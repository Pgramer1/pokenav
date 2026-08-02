import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  // react/react-dom are peer deps — never bundle them into the output.
  external: ['react', 'react-dom'],
  /*
   * Keeps sprite-import.mjs out of the bundle, so its dynamic import survives into the
   * published package for the consumer's bundler to resolve. See that file for why.
   *
   * This has to be a resolve-time interception. `external: ['*.png']` does not work,
   * because esbuild expands a dynamic-import glob before external patterns are matched: it
   * emitted a JS chunk and a copied PNG for all 898 sprites (2704 files, 5.8MB) and leaked
   * a literal `import("../sprites/**\/*.png")` into the output. Externalizing the single
   * module that contains the import sidesteps the expansion entirely.
   *
   * The specifier resolves identically from src/ and from dist/ — both are one level below
   * the package root — so the same string is correct before and after bundling.
   */
  esbuildPlugins: [
    {
      name: 'externalize-sprite-import',
      setup(build) {
        build.onResolve({ filter: /sprite-import\.mjs$/ }, () => ({
          path: '../sprite-import.mjs',
          external: true,
        }));
      },
    },
  ],
  loader: {
    // Every .css file in this package is a CSS Module. This override is required, and
    // must be keyed on `.css` rather than `.module.css`: esbuild matches loaders on the
    // final extension only, and tsup registers its own global `.css` loader that shadows
    // esbuild's automatic CSS-module detection. Without this the style import silently
    // compiles to `{}` — every className `undefined` — and the class names are emitted
    // into the global scope where they collide with consumer styles.
    '.css': 'local-css',
  },
  // The nav is interactive (hover, active route, keyboard), so the whole entry is a
  // client component. Next.js App Router consumers get this for free.
  //
  // NOTE: do not enable `treeshake` here. Its rollup pass strips module-level directives
  // and silently drops this banner, which breaks App Router consumers. Consumers still
  // tree-shake fine via the ESM output plus `sideEffects: false`.
  banner: { js: "'use client';" },
});
