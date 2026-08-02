# pallet — Project Plan

A Pokémon route-map style navigation component for React. A vertical or horizontal trail of
circular nodes connected by a dotted line, each node showing a pixelated Pokémon sprite for
a page/section — like walking a route on the world map. Built first for devanshsoni.com,
extracted here to be installable by anyone.

## Orientation and position are independent axes

`orientation` is which axis the trail runs along. `position` is which edge it anchors to,
and which side the pokéball button and (in vertical) the label sit on. They are deliberately
not conflated, and both combinations of the two are supported.

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
  position: 'left' | 'right';
  orientation: 'vertical' | 'horizontal';
  items: Array<{
    label: string;
    href: string;
    pokemonId?: number;   // pulls from the bundled curated catalogue
    spriteUrl?: string;   // escape hatch: any custom sprite/icon, no Pokémon required
  }>;
  theme?: {
    accentColor?: string;              // drives active ring, hover ring, trail color —
                                         // no hardcoded orange, user's brand color end to end
    ringStyle?: 'solid' | 'pokeball';   // pokeball = red/white split ring
    trailPath?: 'straight' | 'wavy';    // wavy = curved SVG path, not a CSS border
    dotStyle?: 'dotted' | 'dashed' | 'solid';
    font?: string;
  };
};
```
The `spriteUrl` escape hatch is what makes this a real reusable nav library rather than a
novelty — someone with zero interest in Pokémon can still use it with their own art.

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

## 7. Sprite catalogue & picker UI
- Curate a subset of sprites (starters + fan favorites + anything that stays legible at
  icon size) rather than shipping all ~1000 Pokémon.
- Local catalogue: `{ id, name, iconAsset, types }`.
- Build an interactive picker on the docs site: searchable grid → click a nav item → click
  a Pokémon → live preview updates → copy out the generated `NavConfig`. This picker is
  also the primary marketing demo for the launch.

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
5. **Catalogue + picker** — build the sprite catalogue and the interactive picker UI on
   `/apps/docs`. **This is the next step.**
6. **Publish** — npm package, README with GIFs, docs site live, launch posts
   (r/webdev, r/reactjs, Show HN).

## 9. Open risks
- **Sprite copyright**: leans on the same fan-tolerance precedent as PokéAPI. Revisit if
  the project gains real traction — precedent tolerance isn't a legal guarantee.
- **Cries/audio**: deliberately excluded from v1 and v1.x; separate decision required
  before ever bundling.
- **Catalogue size vs curation quality**: better to ship a smaller, well-chosen set than
  a comprehensive one that includes sprites that read poorly at icon scale.

## 10. Status
Phases 1–4 are done. The workspace is scaffolded, the component is built against this spec,
and all theme variants have landed: accent-color theming, both ring styles, both trail
paths, both orientations, and scroll-linked trail fill.

Four sprites are bundled (magnemite, eevee, porygon, sudowoodo) as a working set, not a
curated one. Next concrete step is phase 5: curate the sprite catalogue and build the
picker UI on `/apps/docs`.

Still deliberately unbuilt: the capture-flash route transition (§4, nice-to-have) and
anything audio (§2, §9).
