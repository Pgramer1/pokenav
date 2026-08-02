import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  loader: {
    // Sprites inline as data: URIs so the package is self-contained and needs no bundler
    // config from consumers. Revisit if the catalogue grows large — see src/sprites.ts.
    '.png': 'dataurl',
    // Every .css file in this package is a CSS Module. This override is required, and
    // must be keyed on `.css` rather than `.module.css`: esbuild matches loaders on the
    // final extension only, and tsup registers its own global `.css` loader that shadows
    // esbuild's automatic CSS-module detection. Without this the style import silently
    // compiles to `{}` — every className `undefined` — and the class names are emitted
    // into the global scope where they collide with consumer styles.
    '.css': 'local-css',
  },
  // react/react-dom are peer deps — never bundle them into the output.
  external: ['react', 'react-dom'],
  // The nav is interactive (hover, active route, keyboard), so the whole entry is a
  // client component. Next.js App Router consumers get this for free.
  //
  // NOTE: do not enable `treeshake` here. Its rollup pass strips module-level directives
  // and silently drops this banner, which breaks App Router consumers. Consumers still
  // tree-shake fine via the ESM output plus `sideEffects: false`.
  banner: { js: "'use client';" },
});
