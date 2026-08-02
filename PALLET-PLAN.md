# pallet — Project Plan

A Pokémon route-map style navigation component for React. A vertical (later horizontal)
trail of circular nodes connected by a dotted line, each node showing a pixelated Pokémon
sprite for a page/section — like walking a route on the world map. Built first for
devanshsoni.com, extracted here to be installable by anyone.

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
- **`trailPath: 'wavy'`**: requires the trail to be an SVG `<path>` with a bezier curve and
  a dash-array along the curve to fake the dotted look — a different rendering approach
  from the straight version's CSS border/divider, not a simple style toggle. Scope as its
  own implementation, not an automatic variant of the straight trail.

## 4. Interaction & behavior spec
- **Hover**: subtle bounce/wiggle on the sprite.
- **Active route**: enlarged node + ring highlight, driven by actual current route (not a
  static default).
- **Inactive nodes**: ring uses brand color at low opacity (~10-15%) rather than flat grey,
  so inactive nodes still visually belong to the same system as the active one.
- **Labels**: active/inactive label styling follows one consistent rule (color + weight
  shift together), not two independently-designed states.
- **Sprite sizing**: normalize bounding-box scale/centering across all sprites so each one
  carries equal visual weight inside its circle.
- **Scroll-linked trail fill** (nice-to-have, not required): dotted trail fills in as a
  progress indicator while scrolling through sections.
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
4. **Theme variants** — accent-color theming (replace hardcoded orange), pokéball ring
   style, wavy trail path. Land these once the base component is stable in the workspace —
   wavy trail in particular is its own rendering approach (SVG path vs CSS border) and
   shouldn't block the initial extraction.
5. **Catalogue + picker** — build the sprite catalogue and the interactive picker UI on
   `/apps/docs`.
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
Extraction into this repo is in progress. Next concrete step: scaffold the workspace
structure (section 6), then port the finished, visually-QA'd component over from
devanshsoni.com.
