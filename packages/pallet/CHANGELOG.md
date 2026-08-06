# Changelog

## 0.2.0

A round of fixes from integrating the package into a real consumer site.

**This release contains breaking changes.** The package is pre-1.0, so they land in the
minor slot; after 1.0 this would have been a major. Two things can break an existing
install, both covered under Migrating below.

### Breaking

- **`pokemonId` moved to a new `pokenav/pokemon` entry point.** The core `pokenav` entry now
  resolves `spriteUrl` only. This is the only change that actually removes the ~894 sprite
  wrapper chunks a bundler emits for consumers who never touch `pokemonId` — the sprite
  loader's dynamic `import()` builds a static context over all 898 PNGs, and a static context
  cannot be gated at runtime. The only thing that removes it is an import graph that never
  reaches the catalogue.
- **`catalogue`, `getCatalogueEntry`, `loadSprite`, `getLoadedSprite` and `useSpriteUrls`
  moved to `pokenav/pokemon`** for the same reason — each of them pulls in `catalogue.json`.
- **Vertical node spacing changed by a few pixels.** `.link` is `inline-flex`, so each node
  inherited whatever descender leading the consumer's `line-height` produced — 6px at
  line-height 1.5, 18px at 3. The gap between nodes was therefore `--pallet-gap` *plus an
  unknown*, and the documented gap was not the real one. It is now exactly `--pallet-gap`.

### Deprecated

- **`Pallet` is now `Pokenav`**, matching the package name. `Pallet` and `PalletProps` remain
  as aliases from both entry points, marked `@deprecated`, and **will be removed in the next
  major version**. Renaming alone is not a migration if you use `pokemonId` — see below.

### Added

- **`matchActive`** on `NavConfig`: `'exact'` (default, unchanged behaviour), `'prefix'`, or
  your own `(itemHref, activeHref) => boolean`. Prefix matching is segment- and root-aware —
  `/` matches only `/` instead of lighting up every node, `/blog` does not claim `/blogroll`,
  and trailing slashes, query strings and hashes are normalized away.
- **`alt`** on `NavItem`: an explicit accessible name for a node's sprite. Without it the name
  depended on which resolution path an item used — `pokemonId` gave `"Eevee — Home"` while
  `spriteUrl` gave `"Home"` — so a config mixing the two produced inconsistent names. Setting
  it to `''` marks the sprite decorative and hands the accessible name back to the label.
- **`surfaceColor`** on `NavTheme`: the background the nav is painted on. Only the pokéball
  ring reads it, and it defaults to the `Canvas` system color, which follows the page's
  `color-scheme`.
- **Development warnings** when a node's sprite cannot be resolved: an unknown `pokemonId`, a
  `spriteUrl` that isn't a string or `{ src }`, an item with neither, or `pokemonId` on the
  core entry point. All four rendered an identical empty ring, and two of them were
  indistinguishable from "still loading". Compiled out of production builds.

### Fixed

- **`spriteUrl` now accepts the object form a bundler returns for a static image import.** It
  was passed to `src` raw rather than through the normalizer the catalogue path already used,
  so `import icon from './icon.png'` rendered `[object Object]` wherever the bundler returned
  `StaticImageData` instead of a string. Both paths now share one normalizer, and the prop
  type is widened to `string | { src: string }`. This is the same root cause as the
  `declare module '*.png'` mismatch: the same import can resolve to *different* shapes in one
  app — a package-subpath PNG comes back as a bare string under Turbopack while a local one
  comes back as `StaticImageData`.
- **Consumer CSS now wins regardless of import order.** Every selector in the package
  stylesheet is wrapped in `:where()`, so it contributes zero specificity from its own class
  names. A CSS Module class and a consumer's `[data-pallet]` rule were both (0,1,0), which
  made the winner depend on whether `pokenav/styles.css` was imported before or after the
  consumer's global CSS — and silently reversed the custom-property defaults.
- **`trailPath: 'wavy'` now server-renders.** The path is computed from the stylesheet's own
  geometry constants instead of waiting for a layout read, so the curve is present in the
  server HTML and the first paint rather than appearing straight and then bending after
  hydration. Layout is still measured afterward, and the path redraws *only* if the real
  geometry disagrees — an overridden `--pallet-node-size`, `--pallet-gap` or
  `--pallet-wave-amplitude`, or a root font size that isn't 16px.
- **The pokéball ring is theme-aware.** Its red and white halves were hardcoded and an
  inactive node receded via `opacity: 0.4`, which assumes a light surface — over a dark
  background the white half became a pale halo and read as a glow around the node rather than
  a dimmed ring. Inactive nodes now mix both halves toward `surfaceColor`.

### Migrating from 0.1.x

```diff
- import { Pallet } from 'pokenav';
+ import { Pokenav } from 'pokenav';
```

If any item uses `pokemonId`, change the import path too — the rename alone leaves you with
nodes that render no sprite (and a console warning saying so):

```diff
- import { Pallet } from 'pokenav';
+ import { Pokenav } from 'pokenav/pokemon';
```

Everything else — props, `data-*` attributes, CSS custom properties, `pokenav/styles.css` —
is unchanged.

## 0.1.1

Documentation only — no runtime behaviour changed.

- Corrected `NavOrientation` and `TrailPath` doc comments, which shipped in the 0.1.0
  `.d.ts` claiming `horizontal` and `wavy` were unimplemented. Both have been implemented
  since the theme-variant phase; the comments were left over from when the config shape was
  defined ahead of the rendering work. They surfaced as IDE tooltips on install.

## 0.1.0

First public release.

- `Pallet` component: a trail of circular sprite nodes for page or section navigation.
- Ring styles `solid` and `pokeball`; trail paths `straight` (CSS border) and `wavy`
  (SVG path through measured node centers).
- Both orientations (`vertical`, `horizontal`) and three positions (`left`, `center`,
  `right`), independently combinable.
- `accentColor` theming — one value drives active ring, hover ring, inactive ring, trail and
  focus ring, with no hardcoded colours.
- Scroll-linked trail fill via the `scrollProgress` prop, with the highlight travelling to
  the reached node.
- No ambient state: `activeHref` and `scrollProgress` are plain props, so the component works
  inside scroll containers, virtualized lists and embedded panels. `useScrollProgress()` is
  exported as an opt-in convenience.
- 898 bundled sprites (National Dex 1–898, generations 1–8), lazily loaded one dynamic
  `import()` per id, so only the sprites a config names are fetched.
- `spriteUrl` on any item bypasses the bundled catalogue entirely.
- Self-contained plain-CSS styling exported as `pokenav/styles.css`; `data-*` attributes are
  the public styling contract.
