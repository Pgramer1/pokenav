# pallet — Project Plan

A Pokémon route-map style navigation component for React. A vertical or horizontal trail of
circular nodes connected by a dotted line, each node showing a pixelated Pokémon sprite for
a page/section — like walking a route on the world map. Built first for devanshsoni.com,
extracted here to be installable by anyone.

## Orientation and position are independent axes

`orientation` is which axis the trail runs along. `position` is which edge it anchors to,
and which side the pokéball button and (in vertical) the label sit on. They are deliberately
not conflated, and every combination of the two is supported.

`position: 'center'` centers the trail — `justify-content: center` in horizontal, which is
the common case for a top nav. In vertical it centers the list as a *block* rather than
centering each item: items are as wide as their own label, so `align-items: center` would
put every ring at a different x and the trail would zigzag between them. Shrink-wrapping
the list and centering that keeps every ring on one line, at the cost of the ring column
sitting slightly left of true center by the width of the longest label. For which side the
label and pokéball button sit on, `center` follows `left`.

**Horizontal labels sit below the node, always** — they do not flip with `position`.
Beside the node (the vertical arrangement) would make each item as wide as its label, and
since the trail runs between ring centers it would be drawn straight through the
neighbouring label's text. Below is the only placement that keeps the trail clear of the
type at every item width. Flipping labels above for `position: 'right'` was considered and
rejected: 'left'/'right' say nothing about above/below, so mapping them onto the cross axis
would conflate the two props. In horizontal, `position` controls which end of the container
the trail packs to instead.

In horizontal, each node's track is fixed to the node size so the trail geometry stays
deterministic, and labels may spill into the gap and wrap beyond it — which bounds them at
exactly the point where two neighbours would otherwise collide.

## 1. Concept
- Nodes connected by a dotted trail, one node per nav item.
- Each node shows a small pixel-art sprite (icon-size, ~40x40 — full battle sprites get
  muddy at nav scale).
- Active section is visually distinct: same circular shape as inactive nodes, just with a
  thicker ring, glow, and slight scale-up (not a different shape — this was a specific
  fix from the first prototype, where the active node became a pill and broke visual
  consistency with the rest of the trail).
- Hand-drawn line/circle aesthetic contrasts intentionally with crisp pixel sprites.

## 2. Design decisions (locked in)
- **Target**: React package, works in Next.js (App or Pages Router) with `'use client'`
  on the interactive parts. Framework-agnostic core is a possible future direction, not v1.
- **Sprite delivery**: bundled inside the package itself — no runtime dependency on
  PokéAPI or any external CDN. Consumers can also pass a fully custom `spriteUrl` per item,
  bypassing Pokémon sprites entirely if they want.
- **Sound effects**: out of scope for v1 entirely. Pokémon cries are copyrighted audio —
  a step further into IP risk than sprites — and need a dedicated legal-framing decision
  before ever being bundled. Not a v1.x checkbox; a deliberate later decision.
- **Name**: `pallet` — reference to Pallet Town, the starting point of every Pokémon
  journey. Chosen over more literal alternatives (`route-dex`, `poke-nav`, `navdex`,
  `trailmon`) for having real flavor without leaning as hard on "Pokémon" directly in
  the name, given the sprite-licensing note above.

## 3. Config API
```ts
type NavConfig = {
  position: 'left' | 'center' | 'right';
  orientation: 'vertical' | 'horizontal';
  items: Array<{
    label: string;
    href: string;
    spriteUrl?: string | { src: string };  // any custom sprite/icon, or a static import
    alt?: string;                          // explicit accessible name; '' = decorative
    pokemonId?: number;   // bundled catalogue (898 sprites, lazy) — `pokenav/pokemon` only
  }>;
  theme?: {
    accentColor?: string;              // drives active ring, hover ring, trail color —
                                         // no hardcoded orange, user's brand color end to end
    surfaceColor?: string;              // background behind the nav; pokéball ring only
    ringStyle?: 'solid' | 'pokeball';   // pokeball = red/white split ring
    trailPath?: 'straight' | 'wavy';    // wavy = curved SVG path, not a CSS border
    dotStyle?: 'dotted' | 'dashed' | 'solid';
    font?: string;
  };
  matchActive?: 'exact' | 'prefix' | ((itemHref: string, activeHref: string) => boolean);
};
```
The `spriteUrl` escape hatch is what makes this a real reusable nav library rather than a
novelty — someone with zero interest in Pokémon can still use it with their own art.

**As of 0.2.0 the escape hatch is also the default entry point.** `pokenav` resolves
`spriteUrl` only; `pokenav/pokemon` adds `pokemonId`. Same component, same props, same
stylesheet — the split exists because the sprite loader's dynamic `import()` builds a
*static* context over all 898 PNGs in the consumer's bundler, so no runtime flag can stop
those chunks being emitted. Only an import graph that never reaches the catalogue can. See
§7 and the 0.2.0 changelog.

### Theme/style variants (from user feedback on the first live build)
- **`accentColor`**: single source of truth for active-ring color, hover-ring color, and
  trail color. No color is hardcoded — everything derives from this one value so the
  component matches any consumer's brand.
- **`ringStyle: 'pokeball'`**: ring rendered as two overlapping semicircles (or a
  conic-gradient split), red on top / white on bottom, rather than a single-color CSS
  border — a plain border can't do a hard two-tone split. Center-line + button detail:
  **included**, but constrained to the ring/border area only — no horizontal band crossing
  over the sprite itself. A real pokéball's center line runs straight through the middle;
  here it needs to terminate at the inner edge of the ring so the sprite artwork stays
  fully visible and uncropped. Likely means the "line" is really just the seam where the
  two ring halves meet, plus a small button sitting on that seam at the ring's edge, not a
  line drawn across the whole node.
- **`trailPath: 'wavy'`**: **done.** Built as its own implementation, as scoped — an SVG
  `<path>` with a dash-array along the curve, not a style toggle on the straight trail.
  Resolved details:
  - **Node centers are measured, not derived.** The path is drawn through real measured
    ring centers rather than positions computed from the CSS custom properties. Derived
    positions drift the moment a consumer overrides a size, changes the font, or lets a
    label wrap, and drift breaks the one thing the curve has to get right. Every bezier
    segment begins and ends exactly on a measured center, so the sprite circles sit on the
    path by construction rather than by tuning.
  - **Curve shape**: one cubic bezier per gap, each bulging to the opposite side of the
    previous one at a constant amplitude (`--pallet-wave-amplitude`, default 12px). The
    alternation is what makes it read as a single winding road instead of unrelated
    wobbles, and it also makes the curve smooth at the nodes: the outgoing and incoming
    tangents either side of a node are identical, so there is no kink where segments meet.
  - **The straight trail stays a CSS border.** It needs no measurement, so it survives
    server rendering and no-JS, and it doubles as the fallback the wavy trail shows until
    its geometry has been measured — there is never a frame of disconnected circles.
  - **The trail is punched out at each node.** A mask removes a circle at every node
    center, at that node's real rendered radius, so the curve stops at the ring's outer
    edge instead of running under the ring and across the sprite — matching the straight
    trail, whose CSS segments only ever span the gap. Done as a mask rather than by
    shortening the path, so segment endpoints stay exactly on the node centers and the
    tangents stay continuous; trimming the geometry would trade that away for the same
    visual result. Measuring the radius rather than deriving it means the punch tracks the
    active node's scale automatically.

## 4. Interaction & behavior spec
- **Hover**: subtle bounce/wiggle on the sprite.
- **Active route**: enlarged node + ring highlight, driven by actual current route (not a
  static default).
- **Inactive nodes**: ring uses brand color at low opacity (~10-15%) rather than flat grey,
  so inactive nodes still visually belong to the same system as the active one.
- **Labels**: active/inactive label styling follows one consistent rule (color + weight
  shift together), not two independently-designed states.
- **Focus ring**: drawn with `outline`, not `box-shadow`. The active and scroll-reached
  glows both use box-shadow and carry higher specificity than any reasonable focus
  selector, so a box-shadow focus ring would lose to them exactly on the nodes most likely
  to be focused. A different property cannot be overridden by them at all.
- **Sprite sizing**: normalize bounding-box scale/centering across all sprites so each one
  carries equal visual weight inside its circle.
- **Scroll-linked trail fill**: **done.** The trail fills continuously in `accentColor` as
  a `scrollProgress` prop moves 0→1. Resolved details:
  - **Sourced from the consumer, like `activeHref`.** The component does not read
    `window.scrollY` itself, so it still works where page scroll is the wrong source or
    does not exist — inside a scroll container, a virtualized list, an embedded panel, or
    driven by something that isn't scroll at all. `useScrollProgress()` is exported for the
    ordinary page-scroll case, opt-in and separable.
  - **A separate layer from the active node**, not a replacement for it. Both are visible
    at once: the active node marks where you navigated to, the fill marks how far you have
    read.
  - **Two renderers, one per trail.** The straight trail fills per segment via a CSS
    custom property; the wavy trail fills via an SVG mask so the reveal follows the curve.
    The mask is needed because the visible path is already using its dash array to look
    dotted — the two cannot share it. The mask path carries `pathLength="1"`, which
    renormalizes its dash units so the reveal is length-independent.
  - **The highlight travels with the fill.** When `scrollProgress` is supplied, emphasis
    belongs entirely to the node the trail has reached (`data-reached`): exactly one node
    is lit at a time and it moves with the fill. Ring, glow, scale and label weight all
    travel together, so a node the trail has left behind returns to looking like any
    other. The route-active node hands its highlight over completely rather than keeping
    part of it — two half-emphasised nodes read as two competing indicators, not as two
    different kinds of information. The route survives as `aria-current="page"` on the
    active link, so assistive technology keeps what the visual treatment gives up.
    `data-reached` is chosen with `floor` rather than `round`, so the highlight marks
    where the trail *has got to*, never a node the fill is still travelling toward.
    Without `scrollProgress` nothing changes — the highlight stays on the active node.
  - **The node punch uses the untransformed radius.** Since the highlight moves, so does
    the scale transform. Transforms do not trigger `ResizeObserver` and have not settled
    mid-transition, so a transform-derived punch radius goes stale as soon as the
    highlight moves and never recovers. The layout radius is stable, and the two failure
    directions are not symmetric: a punch slightly smaller than a scaled ring is invisible
    because the ring band paints above the trail and covers the difference, while a punch
    slightly larger leaves a visible gap. The untransformed value can only err harmlessly.
  - **Reduced motion suppresses the transition, not the fill.** The fill is a position
    readout, so removing it would remove information. It updates in step with scroll as a
    static state instead of easing toward a target.
- **Route transition** (nice-to-have): optional capture-flash effect on click.
- All motion respects `prefers-reduced-motion` — no animation at all if the user has it set.

## 5. Accessibility
- Alt text per node: `"{Pokémon name} — {section name}"`, not just the Pokémon name alone.
- Full keyboard navigation with a visible, intentionally-styled focus ring.
- Any sound/extra animation added later ships opt-in via config, never on by default.

## 6. Repo & package structure
npm workspaces (no Turborepo needed at this scale):
```
/packages/pallet/   → the published component: source, types, bundled sprites,
                        catalogue.json
/apps/docs/          → Next.js docs site hosting the sprite picker + live demo
                        (dogfoods the component itself)
```
- Build: `tsup` for ESM + CJS + type declarations.
- `react` / `react-dom` as peerDependencies, not bundled.
- License: MIT for code. `SPRITES-NOTICE.md` at repo root discloses that bundled sprite
  assets are fan-derived Pokémon artwork, not original work, using the same fan-tool
  precedent framing PokéAPI relies on — linked from the README, not buried.

## 7. Sprite catalogue & picker UI — done

### Scope: complete, not curated

**This supersedes the earlier "curate a subset" plan.** The catalogue ships every Pokémon
with a consistent icon-style sprite in the source: **898 entries, National Dex ids 1–898,
generations 1–8, no gaps.** Curation was the right call when every sprite cost bundle
weight for every consumer; once sprites load lazily, an unused entry costs a row of JSON,
so the argument for hand-picking evaporated. The picker's search and generation filter do
the narrowing that curation was going to do, and they do it per consumer instead of once
for everyone.

- Entry shape is `{ id, name, generation, iconAsset, types }`. `generation` is what the
  picker filters on.
- `catalogue.json` is complete and eagerly bundled — 148KB raw, ~13KB gzipped. It is text
  data the picker needs in full, and lazy-loading it would buy little.

### Sourcing

- Source: `PokeAPI/sprites`, `sprites/pokemon/versions/generation-viii/icons`. Rebuilt any
  time by `node scripts/build-catalogue.mjs`.
- **127 ids skipped (899–1025):** the Legends: Arceus additions and all of generation 9
  have no icon-style sprite in that set, and no `generation-ix` icons directory exists.
  Per the "skip rather than mismatch" rule they are omitted rather than filled in from a
  different sprite style. If the source adds them, re-running the script picks them up.
- **Sprites are trimmed of transparent padding on download.** The source icons are a
  uniform 68x56 canvas; the artwork inside is much smaller and off-center. Left untrimmed,
  the sprite normalization in §4 scales the *canvas* to fit the node and every sprite
  renders tiny. Trimming was verified against the four sprites already in the repo — all
  four reproduce at exactly their existing dimensions, which also confirms the source.
- Metadata comes from PokeAPI's aggregate `generation` and `type` endpoints: ~29 requests
  instead of ~900. Downloads run in batches of 24 with a pause between them.
- Alternate forms (ids ≥ 10000, and named variants like `201-b.png`) are skipped. The
  catalogue is keyed by National Dex id, which those would collide on.

### Lazy sprite loading

Sprites are loaded with a dynamic `import()` per id, never a static lookup table. A static
table inlines all 898 sprites into the package's main chunk and ships them to every
consumer regardless of which handful their `NavConfig` names.

Getting this to survive the build took three attempts, and the shape of the final answer is
not obvious:

- A `dataurl` loader inlined all 898 into the **CJS** bundle — 980KB — because esbuild
  cannot code-split CJS. ESM split fine; CJS silently did not.
- `external: ['*.png']` does not work. esbuild expands a dynamic-import glob at resolve
  time, *before* external patterns are matched: it emitted a JS chunk and a copied PNG for
  every sprite (2704 files, 5.8MB) and leaked a literal `import("../sprites/**/*.png")`
  into the output.
- What works: the import lives in **`sprite-import.mjs`, published unbundled** and
  externalized by an esbuild plugin. Its template literal reaches the consumer's bundler
  intact, which is the form Webpack, Vite, Next and Rollup all understand.

**Measured, on the docs site's production build (config naming 4 of 898 sprites):**

| | result |
| --- | --- |
| Sprite bytes in any JS bundle | none |
| JS actually downloaded | 198KB across 11 files, of 906 chunks / 4.7MB on disk |
| Sprites actually fetched | 4 — exactly the ids in the config |
| Package `dist/` | 8 files, entries 156KB, no sprite data |

**What this does not achieve, and cannot:** the consumer's *build output* still contains
all 898 sprites as separately-loadable assets. No bundler can know which numeric ids a
runtime config will name, so it must emit the whole context. Those assets are never
downloaded — only the referenced ones are — but they do occupy deploy space. Eliminating
them entirely requires the sprite choice to be statically visible, which is exactly what
the `spriteUrl` escape hatch already allows:

```ts
import eevee from 'pokenav/sprites/133.png';
items: [{ label: 'Home', href: '/', spriteUrl: eevee }]
```

That form tree-shakes perfectly. `pokemonId` trades it for zero-config convenience.

One consequence worth stating: because sprites resolve asynchronously, they are absent from
server-rendered HTML and appear after hydration. Nodes render label-only until then, so the
trail keeps its shape either way. That is the cost of not inlining them.

Bundlers disagree on what an image import yields — Webpack, Vite and Rollup return a URL
string, Next returns a `StaticImageData` object — so the loader normalizes both. Assuming a
string made every sprite silently missing in Next, which is how that was found.

### Picker UI

The primary "try it" experience at the top of the docs site: pick a slot → choose a sprite →
copy the config, with a live `Pallet` preview beside it and ring/trail/axis/accent controls.

- **Generation filter is tabs, not a dropdown.** There are only 8 generations, so tabs fit
  on one row, cost one click instead of two, and show the whole range at a glance. A
  dropdown would hide the axis the catalogue is organised by.
- **Grid cells load their sprite via IntersectionObserver.** Rendering all 898 at once and
  importing eagerly would fire 898 chunk requests on mount — precisely the problem the lazy
  API exists to prevent. Verified: loading the page fetches 24 sprites, the visible cells
  plus the preview, not 898. One shared observer serves every cell.
- **Choosing a sprite advances to the next slot**, so filling four items is four clicks
  rather than eight.
- Slot labels and hrefs are editable inline, and items can be added or removed, so the
  copied config is genuinely the consumer's rather than a fixed sample.

## 8. Build phases
1. **Prototype** (done on devanshsoni.com) — hardcoded 4-node vertical nav, real sprites
   from the start, core interaction feel established.
2. **Visual QA pass** (done on devanshsoni.com, by hand) — active-state shape consistency,
   label styling, ring color, sprite normalization, route-driven active state. See section 4
   for the resolved spec.
3. **Extraction** (this repo) — port the finished component into the `pallet` workspace,
   generalize hardcoded items into the `NavConfig` API above.
4. **Theme variants** (done) — accent-color theming, pokéball ring style, wavy trail path,
   horizontal orientation, scroll-linked trail fill. Wavy landed as its own rendering
   approach (measured SVG path vs CSS border), as scoped.
5. **Catalogue + picker** (done) — full 898-sprite catalogue, lazy sprite loading, and the
   interactive picker UI on `/apps/docs`. See §7.
6. **Publish** (done) — `pokenav` is live on npm, docs site is live. Outstanding: README
   GIFs, making the GitHub repo public, launch posts (r/webdev, r/reactjs, Show HN).
7. **Consumer-integration fixes** (done, 0.2.0) — the first round of changes driven by
   installing the package into a real site rather than by the plan. Component renamed
   `Pallet` → `Pokenav` (old name kept as a deprecated alias for one version); the package
   split into `pokenav` / `pokenav/pokemon`; `spriteUrl` routed through the same URL
   normalizer as the catalogue path and widened to accept a bundler's static-import object;
   the stylesheet dropped to specificity 0 via `:where()`; `matchActive`, `alt`,
   `surfaceColor` and dev-mode sprite warnings added; the wavy trail made
   server-renderable; the pokéball ring made theme-aware. Full detail in the 0.2.0
   changelog.
8. **Review fixes + scroll-spy** (done, 0.3.0) — a correctness pass over 0.2.0, and the
   first tests in the project. `matchActive: 'prefix'` matched every fragment-only href
   against every other; `aria-current` and the visual highlight were computed independently
   and diverged under `scrollProgress`; `aria-current="page"` was the wrong token for
   in-page anchors; the trail geometry constants were hardcoded rather than generated from
   the stylesheet; dev warnings escaped to production wherever `process` is absent. Adds
   `useSectionProgress`, `theme.geometry` and the `data-current` attribute. Full detail in
   the 0.3.0 changelog.

## 9. Open risks
- **Sprite copyright**: leans on the same fan-tolerance precedent as PokéAPI. Revisit if
  the project gains real traction — precedent tolerance isn't a legal guarantee.
- **Cries/audio**: deliberately excluded from v1 and v1.x; separate decision required
  before ever bundling.
- **Catalogue size vs curation quality**: resolved by shipping the complete set with lazy
  loading and letting the picker's search and generation filter do the narrowing — see §7.
  Unused entries no longer cost consumers anything but a row of JSON.

## 10. Status
Phases 1–8 are done. The workspace is scaffolded, the component is built against this spec,
all theme variants have landed (accent-color theming, both ring styles, both trail paths,
both orientations, scroll-linked trail fill), the complete 898-sprite catalogue ships with
lazy loading behind the interactive picker on `/apps/docs`, and **`pokenav` is published to
npm**. Release history is in `packages/pallet/CHANGELOG.md`.

**0.2.0 is the first release driven by consumer feedback rather than by this plan**, and it
is the first to break compatibility: `pokemonId` moved to the `pokenav/pokemon` entry point
and the component is now `Pokenav`. Both are covered in the changelog's migration notes.
That shifts what "the plan wins" means from here on — the config API is a shipped contract
with installs behind it, so a change to `data-*` attributes, `NavConfig` or the CSS custom
properties now costs consumers a migration regardless of what this document says. Treat
§3's shape as a record of what is published, not as a proposal.

The package name is settled — **`pokenav`**, unscoped. (`pallet` itself is taken by an
abandoned PureScript package manager, which is why the name moved.) The docs site is live at
**pokenav.devanshsoni.com** and the repo is `Pgramer1/pokenav`.

Publishing requires npm 2FA or a granular access token with 2FA bypass; a 403 on `PUT` with
no other explanation is that gate, not a name conflict.

Open items:
- **The repo is still private.** `repository`, `bugs` and every GitHub link in the published
  README 404 for anyone installing from npm. This is now live-facing rather than
  pre-release — it is the highest-priority remaining item, and it needs no republish.
- README GIFs.

Still deliberately unbuilt: the capture-flash route transition (§4, nice-to-have) and
anything audio (§2, §9). Generation 9 sprites are absent from the upstream source rather
than skipped by choice — re-running `scripts/build-catalogue.mjs` picks them up if that
changes (§7).
