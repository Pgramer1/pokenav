# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PALLET-PLAN.md is the source of truth

Read it before making design decisions. It holds the config API, the locked-in decisions,
the behavior spec, and the build phases. When a request conflicts with it, the plan wins
unless the user explicitly overrides — and a shape stated in an earlier chat message is
superseded by the plan document.

Phases 1–7 are done: the component is built, all theme variants have landed, the full
898-sprite catalogue ships behind the picker, `pokenav` is published to npm, and 0.2.0
landed the first round of consumer-integration fixes.
Further work is versioned releases on top of a settled config API — treat the documented
public surface (`data-*` attributes, `NavConfig`, CSS custom properties) as a contract that
breaks consumers if changed.

**The component is `Pokenav`, not `Pallet`.** `Pallet`/`PalletProps` survive as
`@deprecated` aliases from both entry points for one version and are removed in the next
major. The workspace folder stays `packages/pallet` and the CSS module stays
`pallet.module.css` — internal layout doesn't have to match the published name, and the
`--pallet-*` custom properties are a shipped contract that cannot be renamed cheaply.

## Docs site routes

`/` is the playground (hero + picker + variant demos); `/usage` is the written documentation.
`SiteNav` in the layout is the tab bar. Usage-page examples render a real `<Pallet>` and
generate their code block from the *same* config object via `CodeExample` — never write a
snippet by hand next to a live example, or the two drift.

Shared docs chrome: `CopyButton` (every copy affordance — don't re-implement the copied/failed
timer), `ThemeToggle`, `Footer`, and `usage/Toc` (the "on this page" rail).

**Theme is `prefers-color-scheme` until the visitor overrides it.** The toggle writes
`pokenav-theme` and the inline script in `layout.tsx` replays it in `<head>` before first
paint — that script is why `<html>` carries `suppressHydrationWarning`. The `[data-theme]`
token blocks must stay *after* the `prefers-color-scheme` media query in `globals.css`, or a
stored choice loses to the OS setting in one direction.

### Two flex/grid traps that already cost real layout bugs

Both are silent — the build passes and the page looks plausible until you check a narrow
viewport or measure a card.

- **`flex-basis` is an axis, not a width.** `.demo` is used in both `.demos` (row) and
  `.demosStacked` (column), so a basis set on the class itself became a 240px *height* in the
  stacked container. Set the basis on `.demos > .demo` / `.demosStacked > .demo`, never on the
  shared class. The same bug hit `.slot` once `.slotRow` flips to a column on mobile.
- **`margin: 0 auto` on a grid item disables stretch.** The base `main` rule centers the page
  that way; inside `.docsLayout`'s grid that made `main` shrink-to-fit its *min-content*
  (565px) instead of filling its 358px track, putting the whole usage page into horizontal
  scroll on a phone. `.docsLayout main` resets `margin` for exactly this reason.

Bare `<input>` reports a ~20-character intrinsic min-width, so any flex row containing one
needs `min-width: 0` on the row or it will not shrink. Check page overflow with
`document.documentElement.scrollWidth` against the viewport, not by eye.

## Commands

```bash
npm install                        # installs all workspaces
npm run build                      # builds packages/pallet (tsup)
npm run typecheck                  # tsc --noEmit across both workspaces
npm run dev                        # docs site at localhost:3000
npm run dev:pallet                 # tsup --watch, run alongside `dev` when editing the package
npm run build --workspace apps/docs # production build of the docs site
```

The docs app imports the package's **built output**, not its source. Run `npm run build`
at least once before `npm run dev`, or run `dev:pallet` alongside it.

```bash
npm test                           # node --test in packages/pallet
```

**Tests run on Node's built-in runner — no framework, no dependency.** Two kinds, and the
split is forced rather than stylistic:

- `test/*.test.ts` import source directly through Node's type stripping, which only resolves
  *type-only* imports (the rest of `src` uses extensionless specifiers a bundler resolves,
  and Node will not). So only leaf modules — `matchActive`, `sectionProgress`,
  `currentNode`, `analyticGeometry`, `warn` — can be tested this way. Keep them that way.
- `test/*.test.mjs` import `dist/`, which needs `npm run build` first and has the side
  benefit of testing what actually ships. Anything with runtime imports goes here.

Node's `--test` glob does not take a bare directory; `node --test` with no arguments
auto-discovers. `tsconfig.test.json` typechecks the tests separately so `@types/node` never
enters `src`'s scope — `npm run typecheck` runs both.

**Headless Chrome cannot test scroll behaviour.** Under `--virtual-time-budget` it fires
roughly one scroll event and one rAF callback for an entire sweep, no matter how many times
you set `scrollTop` — measured, not assumed. Anything rAF-driven (`useScrollProgress`,
`useSectionProgress`, trail re-measurement) has to be verified by unit-testing the
arithmetic and checking the wiring in a real browser. Don't read a headless "mismatch" in
scroll code as a bug without first counting the events.

## Verifying visual work

Typecheck and build pass happily on visually broken output, and markup assertions do too.
Two real geometry bugs (the ring cropping sprite corners, the pokéball button breaking the
circular silhouette) got through both and were only caught by looking. Screenshot before
claiming a visual change works:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu \
  --screenshot=out.png --window-size=1000,1150 --hide-scrollbars \
  --virtual-time-budget=4000 "http://localhost:3000/"
```

For detail work, build a harness page that inlines `packages/pallet/dist/index.css` plus
the nav markup copied from the served HTML, and set `body { zoom: 3 }`. That tests the real
CSS against the real markup at a scale where geometry errors are visible.

Note that `next dev` survives killing its npx wrapper, and Next 16 refuses a second dev
server for the same directory. Sweep for orphaned `node.exe` processes running `next dev`
if a restart claims the port is taken.

## Build configuration traps

Both of these fail **silently** — the build reports success and the damage only shows at
runtime in a consumer app. Don't "clean up" either one.

- **`loader` must key CSS on `.css`, not `.module.css`.** esbuild matches loaders on the
  final extension only, and tsup registers its own global `.css` loader that shadows
  esbuild's CSS-module detection. Keyed wrong, the style import compiles to `{}` (every
  `className` becomes `undefined`) and the class names land in the global scope where they
  collide with consumer styles.
- **`treeshake` must stay off.** Its rollup pass strips module-level directives, which
  silently drops the `'use client'` banner and breaks every Next App Router consumer.

## Architecture

`packages/pallet` is the published component (`pokenav`); `apps/docs` is a
Next.js site that dogfoods it. npm workspaces, no task runner.

**Two entry points, and the split is load-bearing.** `pokenav` (`src/index.ts`) resolves
`spriteUrl` only. `pokenav/pokemon` (`src/pokemon.ts`) adds `pokemonId`, and is the only
one whose import graph reaches `catalogue.json` and `sprites.ts`. Nothing reachable from
`src/index.ts` may import either — that is the whole mechanism, since the sprite loader's
`import()` builds a *static* context over all 898 PNGs that no runtime flag can gate. The
core entry is 21KB CJS against pokemon's 162KB; if that gap closes, something leaked.

`NavView.tsx` is the shared renderer and holds every bit of geometry, styling and
accessibility. `Pokenav.tsx` and `PokemonNav.tsx` are thin resolvers above it that turn a
`NavItem` into a `NavViewItem` (a resolved `url` + `alt`). Put rendering changes in
`NavView`, not in the resolvers — duplicating there is how the two entry points drift.

**No ambient state.** `activeHref` and `scrollProgress` are plain props. The component holds
no route state, reads no `window.scrollY`, subscribes to nothing, and imports no router —
consumers supply both values. `useScrollProgress()` is exported as an opt-in convenience and
is deliberately *not* called inside `Pallet`. Do not add router detection or an internal
scroll listener; it would break the component inside scroll containers, virtualized lists,
and embedded panels.

**Self-contained styling is a hard requirement**, not a preference. Plain CSS Modules in
`src/pallet.module.css`, emitted to `dist/index.css` and exported as
`pokenav/styles.css`. No Tailwind, no preprocessor, no framework coupling —
the package must work for a consumer who uses none of those. `apps/docs/app/globals.css`
deliberately contains zero `[data-pallet*]` selectors; keeping it that way is what proves
the component is self-contained.

**Every class selector in that stylesheet is wrapped in `:where()`.** A CSS Module class and
a consumer's `[data-pallet]` rule are both (0,1,0), so which won depended on whether
`pokenav/styles.css` was imported before or after their global CSS. Keep new rules in the
same form: wrap the classes, leave attributes and pseudo-classes outside. Every rule lost
exactly its class count, so internal precedence is unchanged — but where two rules now tie,
source order decides, which is why the file is ordered base → hover → active → scroll-fill
→ orientation → focus → motion. Adding a rule out of that order is how you break it.

**The ring is a pseudo-element overlay, not a border on the sprite's box.** That separation
is why ring thickness can change on hover/active without shifting the sprite, and it's the
only way the pokéball variant can draw a hard two-tone split — a CSS border can't.

**`data-*` attributes are the public styling contract** (`data-pallet`, `data-position`,
`data-active`, `data-pallet-ring`, `data-pallet-sprite`, `data-pallet-label`, …). The
generated class names are not. Style against the attributes and document them; don't expose
class names as API.

**Sprite geometry invariant:** `node-size - 2 × ring-thickness >= sprite-size × 1.415`.
The sprite box is a square inside a circle, so its *corners* bind, not its edges. Violating
this pushes the artwork under the ring band, where it gets painted over. Recheck the
inequality whenever node size, sprite size, or pokéball thickness changes.

**`sprites/` and `catalogue.json` are generated, not hand-maintained.** Both come out of
`scripts/build-catalogue.mjs` in one pass (898 entries, `{id, name, generation, iconAsset,
types}`, ids 1–898). Hand-edit neither — a manual entry is lost on the next regeneration.
See `packages/pallet/SPRITES-MAINTENANCE.md`.

**Sprites load through a dynamic `import()` per id, not as inlined `data:` URIs.** That's
what keeps 898 sprites out of every consumer's bundle — only the ids a `NavConfig` names are
fetched. Two constraints hold it up: `sprite-import.mjs` is published *unbundled* and
excluded from tsup (esbuild would expand the glob into 898 chunks and inline them into the
CJS build), and its template literal must stay inline — hoisting the path into a variable
makes it unanalyzable to every bundler and sprites stop resolving in production. The package
still has no runtime dependency on PokéAPI or any CDN — the assets ship in the tarball.

**Both sprite paths normalize through `toUrl.ts`, and that sharing is the point.** A
bundler may return a URL string or a `StaticImageData`-shaped object for the *same* import
— a package-subpath PNG comes back as a bare string under Turbopack while a local one comes
back as an object. `spriteUrl` originally skipped the normalizer the catalogue path already
had and rendered `[object Object]`; that is the same bug fixed on one side and left standing
on the other. Don't reintroduce a second normalizer.

**`spriteUrl` bypasses the catalogue entirely.** It's what makes this a general nav library
rather than a Pokémon novelty, it's the answer to the licensing question for consumers, and
since 0.2.0 it's the only path the default entry point supports. Keep it working.

**Two trail renderers, on purpose.** The straight trail is a CSS border; the wavy trail is
an SVG path. Don't unify them — the straight one needs no measurement and no JS at all.
Scroll fill follows the same split: a CSS custom property per segment for straight, an SVG
mask for wavy.

**One computation decides the current node.** `currentNode.ts` picks it — the reached node
when `scrollProgress` is set, the longest-matching route otherwise — and both the
`data-current` attribute the stylesheet styles and the `aria-current` the component renders
read that one answer. They were separate before, and diverged under `scrollProgress`: the
glow followed the fill while `aria-current` stayed on the route. Don't reintroduce a second
source. `data-active` and `data-reached` are still emitted as raw facts, but nothing in the
package's own CSS keys emphasis off them.

**The wavy path is computed first and measured second.** `analyticGeometry.ts` derives node
centers from `cssGeometry.ts`, which `scripts/build-css-geometry.mjs` generates from the
`:where(.nav)` block of `pallet.module.css` — the numbers live in the stylesheet only, and a
test fails if the generated mirror drifts. So the curve exists in server HTML and the first
paint; it used to render straight and bend after hydration. A consumer overriding those
custom properties *in CSS* still gets one corrective redraw, because no build step can read
their stylesheet; `theme.geometry` is the escape hatch that feeds the computation and emits
the properties from one value. `useTrailGeometry` still measures, but returns `null` while the measurement
agrees, so the common case costs zero re-renders — check `data-trail-measured` in a
post-hydration DOM dump to confirm nothing switched over. Three attributes, three
questions: `data-trail-svg` (an SVG trail is on screen — what stands the CSS segments
down), `data-trail-analytic` (it's in ring-column coordinates and needs edge anchoring),
`data-trail-measured` (layout was read and disagreed).

That anchoring is why `[data-position='center']` shrink-wraps `.trailWrap` rather than
`.trail`: the wrapper's left edge has to *be* the ring column's left edge, or the offset
between computed coordinates and real ones is unknowable without measuring. Node height has
to be deterministic for the same reason, which is what `vertical-align: top` on `.link` is
for — an `inline-flex` box sits on the baseline and picks up the consumer's line-height as
descender leading, so the real gap was `--pallet-gap` plus an unknown.

**The wavy fill needs a mask, not a dash offset.** The visible path is already using its
dash array to look dotted, so the reveal can't share it. The mask path carries
`pathLength="1"` so its dash units renormalize and the reveal is length-independent. The
visible paths deliberately have no `pathLength`, keeping their dots at constant px spacing.

**The wavy path runs center-to-center and is masked, not trimmed.** A second mask punches a
circle out at each node so the trail stops at the ring edge instead of crossing the sprite.
Don't "simplify" this by shortening the path to the ring edges — running center-to-center is
what keeps segment endpoints exactly on node centers and the tangents continuous.

**The punch radius comes from `offsetWidth`, not the bounding rect.** It must exclude the
highlighted node's scale transform. Transforms don't trigger `ResizeObserver` and haven't
settled mid-transition, so a rect-derived radius goes stale the moment the highlight moves.
The errors are also asymmetric: too small is invisible (the ring band paints over the trail
and covers it), too large leaves a visible gap. Centers still come from the rect — scaling
is about the center, so that part is unaffected.

**The focus ring uses `outline`, not `box-shadow`.** The active and scroll-reached glows are
box-shadows with higher specificity than any reasonable focus selector, so a box-shadow
focus ring silently loses on exactly the nodes most likely to be focused. Keep them on
different properties.

## Not implemented (deliberately)

The capture-flash route transition (plan §4) is an unbuilt nice-to-have.

Sound effects and Pokémon cries are out of scope for v1 and v1.x. Copyrighted audio is a
materially different risk from sprite artwork and needs its own decision first.

## Licensing

Code is MIT. Bundled sprites are fan-derived Pokémon artwork, are **not** covered by that
license, and rely on the same fan-tolerance precedent as PokéAPI — a precedent, not a legal
guarantee. `SPRITES-NOTICE.md` carries the disclosure and must stay linked from the README
rather than buried. Keep it accurate when the bundled set changes.

## Commits

Do not add `Co-Authored-By: Claude` or any Claude/Anthropic attribution to commit messages
or git config. Commit author is Pgramer1 only.
