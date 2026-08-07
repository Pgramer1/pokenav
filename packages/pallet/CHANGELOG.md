# Changelog

## 0.3.0

Bug fixes from a review of 0.2.0, plus a hook for section navigation. No prop-shape changes
and nothing removed, so upgrading is a version bump.

This release also adds the project's first tests — `npm test`, on Node's built-in runner,
no framework added. Every fix below has one.

### Added

- **`useSectionProgress(hrefs, options?)`** — scroll-spy for in-page section navs, returning
  `{ activeHref, scrollProgress }`. The README documented `activeHref={visibleSectionId}`
  but shipped nothing to compute it, and the obvious pairing is wrong: the node highlight is
  recovered from progress as `floor(progress × (stops - 1))`, which assumes every section
  occupies an equal share of the scroll range. On a page with unevenly-sized sections, a
  `scrollProgress` taken from raw document scroll leaves the highlight on the wrong node for
  most of the page, with late sections only lighting up as progress approaches 1. This
  reports progress in *section-space* instead, so that floor recovers the section index by
  construction.

  The activation line defaults to the scroll container's `scroll-padding-top` — the property
  that already exists to land anchor links below a sticky header — so click-to-scroll and
  scroll-spy agree without configuring anything twice. Override with `offset`; pass `target`
  to track a scrollable element. Section positions are re-measured per scroll and resize,
  and observed for size changes, because entrance animations and late-loading media move
  them after first paint.
- **`theme.geometry`** (`{ nodeSize, gap, waveAmplitude }`, px) — geometry overrides the
  server-rendered trail can actually see. See the fix below.
- **`data-current`** on the emphasised node, now the attribute the stylesheet keys every
  highlight off. `data-active` and `data-reached` are still emitted unchanged.

### Fixed

- **`matchActive: 'prefix'` made every fragment-only href match every other.** `#work`,
  `#writing` and `#home` all reduce to the same empty path, and the equality check ran
  *before* the empty-path guard — so a section nav lit up completely and stayed that way.
  Hrefs with no path of their own (`#work`, `?page=2`, `''`) now match exactly and never
  prefix-match. Query-only hrefs had the same defect and are covered by the same guard. All
  the path behaviour — `/` matching only the root, `/blog` not claiming `/blogroll`,
  trailing slashes and query strings normalizing away — is unchanged and regression-tested.
- **`aria-current` and the visual highlight could point at different nodes.** They were two
  independent computations: emphasis followed `reachedNodeIndex(scrollProgress)` while
  `aria-current` followed `isItemActive(activeHref)`. With `scrollProgress` set they diverge
  as soon as the fill passes the first node, so a screen reader announced one stop while the
  page showed another. Both now read from a single `currentNodeIndex`, and the stylesheet's
  scroll-fill handover rules are gone rather than merely consistent. Where several items
  match under prefix matching, the longest matching href is the current one.
- **`aria-current="page"` was wrong for in-page section navs.** `page` means the current page
  within a set of pages; an anchor nav never leaves the page. A fragment-only href now
  renders `aria-current="location"`, inferred from the href.
- **`analyticGeometry` hardcoded the node size, gap and amplitude**, so editing
  `pallet.module.css` silently desynchronised the server-rendered curve from the layout the
  browser produces. They are now generated from the stylesheet by
  `scripts/build-css-geometry.mjs` and mirrored into `src/cssGeometry.ts`, with a test that
  fails if the two drift.

  A consumer overriding those custom properties **in CSS** is a separate problem, and one a
  shared source cannot solve — the server has no way to read a stylesheet it never
  evaluates. That case now behaves as documented rather than silently: the first paint uses
  the defaults and measurement corrects it. `theme.geometry` is the way to avoid the
  correction, feeding the computation and emitting the custom properties from one value. The
  CSS custom-properties table marks which three properties this applies to.
- **Development warnings could reach production.** The gate tested for production and
  treated everything else as development, so an absent `process` — a browser loading the ESM
  build from a CDN, an edge runtime, a worker — counted as development and shipped warnings
  to real users. Inverted: warnings run only where `NODE_ENV` positively reports a
  non-production value, and anything undetermined is treated as production.

### Changed

- The stylesheet's highlight rules moved from `[data-active]` / `[data-reached]` to
  `[data-current]`. If you style `[data-active]` yourself, that still works — it is still
  emitted on every route-matched item. If you were relying on the *package's* highlight
  appearing on `[data-active]`, target `[data-current]` instead.

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
