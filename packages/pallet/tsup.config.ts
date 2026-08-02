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
  // The nav is interactive (hover, active route, keyboard), so the whole entry is a
  // client component. Next.js App Router consumers get this for free.
  //
  // NOTE: do not enable `treeshake` here. Its rollup pass strips module-level directives
  // and silently drops this banner, which breaks App Router consumers. Consumers still
  // tree-shake fine via the ESM output plus `sideEffects: false`.
  banner: { js: "'use client';" },
});
