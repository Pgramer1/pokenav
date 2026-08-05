# sprites/

898 sprites ship with the package — National Dex ids 1–898, generations 1–8, one
`sprites/<id>.png` per entry. Generation 9 has no icon-style sprite in the upstream source,
so those ids are absent rather than filled in from a mismatched sprite style.

**This directory and `catalogue.json` are generated, not hand-maintained.** Both come out of
`scripts/build-catalogue.mjs` in one pass. Don't hand-edit either — a manual entry is lost on
the next regeneration, and a sprite without a catalogue row is invisible to the picker.

## Regenerating

```bash
node scripts/build-catalogue.mjs      # needs `sharp`; hits PokéAPI, takes a few minutes
```

It downloads the generation-viii icon set from
[PokeAPI/sprites](https://github.com/PokeAPI/sprites), trims each sprite's transparent
padding with `sharp` so the artwork fills its box, writes `sprites/<id>.png`, and emits
`catalogue.json` as `{ version: 2, entries: [...] }` where each entry is
`{ id, name, generation, iconAsset, types }`.

Generation and type metadata come from PokéAPI's aggregate endpoints (9 generation + ~20
type requests) rather than one request per species, so a rebuild costs ~30 metadata requests
instead of ~900. Ids probed up to 1025; anything that 404s is skipped and reported.

If Generation 9 icons ever land upstream, re-running this picks them up with no code change.
Bump `version` in the emitted JSON if the entry shape changes, so generators can migrate.

## How sprites reach the browser

Sprites are **not** inlined as `data:` URIs and **not** fetched from PokéAPI or any CDN at
runtime. They resolve through a dynamic `import()` per id, so only the handful a consumer's
`NavConfig` actually names is ever downloaded.

Two files make that work, and both have load-bearing constraints:

- **`sprite-import.mjs`** is published unbundled and is deliberately excluded from tsup.
  It holds the single `import(\`./sprites/${id}.png\`)` call. Keep the template literal
  inline — hoisting the path into a variable makes it unanalyzable to every bundler and the
  sprites stop resolving in production builds.
- **`src/sprites.ts`** wraps that import with a resolved-URL cache, a miss set, and an
  in-flight map, then normalizes the result. Bundlers disagree about what importing an image
  yields: Webpack, Vite and Rollup hand back a URL string, while Next.js hands back a
  `StaticImageData` object. A string check alone silently treats every sprite in a Next app
  as missing.

Because sprites resolve through a dynamic import, they are absent from server-rendered HTML
and appear after hydration. The ring and trail still draw, so the layout does not shift.

## Packaging

`sprites` is listed in `package.json#files` and exposed via the `./sprites/*` export, so
adding sprites needs no packaging change. That export is also what lets a consumer bypass
the lazy path entirely for a statically analyzable, fully tree-shakeable import:

```tsx
import eevee from 'pokenav/sprites/133.png';
```

## Licensing

These assets are fan-derived Pokémon artwork and are **not** covered by this project's MIT
license. Read `SPRITES-NOTICE.md` before adding anything here, and keep it accurate when the
bundled set changes — it states the exact id range and generation coverage.
