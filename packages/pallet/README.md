# pokenav

A Pokémon route-map style navigation component for React — a trail of circular nodes
connected by a dotted line, each showing a pixel-art sprite, like walking a route on the
world map.

**[Playground and full docs → pokenav.devanshsoni.com](https://pokenav.devanshsoni.com)** —
search all 898 sprites, assign them to nav items, and copy out the generated config.
Source on [GitHub](https://github.com/Pgramer1/pokenav).

> **Status: 0.2.0.** The config API is settled and everything documented here is
> implemented: both ring styles, both trail paths, both orientations, accent-colour
> theming, and scroll-linked trail fill.
>
> Upgrading from 0.1.x? `Pallet` is now `Pokenav`, and `pokemonId` moved to the
> `pokenav/pokemon` entry point. See [CHANGELOG.md](CHANGELOG.md).

## Install

```bash
npm install pokenav
```

`react` and `react-dom` (>=18) are peer dependencies.

## Usage

```tsx
import { Pokenav, type NavConfig } from 'pokenav';
import 'pokenav/styles.css';

import homeIcon from './icons/home.png';
import workIcon from './icons/work.png';
import contactIcon from './icons/contact.png';

const config: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', spriteUrl: homeIcon },
    { label: 'Work', href: '/work', spriteUrl: workIcon },
    { label: 'Contact', href: '/contact', spriteUrl: contactIcon },
  ],
  theme: {
    accentColor: '#f97316',
    dotStyle: 'dotted',
  },
};

export function Nav() {
  return <Pokenav {...config} />;
}
```

Import the stylesheet once, anywhere in your app (in Next.js App Router, your root
layout). It's plain CSS with scoped class names — no Tailwind, no framework coupling, and
nothing to configure.

`spriteUrl` takes a plain URL string or the object a bundler hands back for a static image
import — Next.js returns `StaticImageData` rather than a string, and both work.

## Two entry points

| Import                | Resolves                    | Use when                                        |
| --------------------- | --------------------------- | ----------------------------------------------- |
| `pokenav`             | `spriteUrl`                 | **Default.** Your own artwork, any image source. |
| `pokenav/pokemon`     | `spriteUrl` **+** `pokemonId` | You want the bundled Pokémon catalogue.        |

Same component, same props, same styling. The difference is what ends up in your build.

**Reach for `pokenav` unless you need `pokemonId`.** The core entry ships no
`catalogue.json` and no dynamic-import context over the 898 bundled sprites, so your
bundler emits nothing for them. `pokenav/pokemon` adds catalogue resolution — and with it a
separately-loadable chunk per sprite, because the import context is built statically and
your bundler cannot know which numeric ids a runtime config will pick. Those chunks are
never *downloaded* unless a config names them, but they occupy build output, and there is
no runtime flag that removes them: the only thing that does is an import graph that never
reaches the catalogue.

The core entry is also the only one that renders artwork in server-side HTML. A `spriteUrl`
is already a URL by the time the component sees it; a `pokemonId` resolves through a
dynamic `import()` that cannot run until hydration.

```tsx
// Pokémon sprites — same component, one import path further
import { Pokenav } from 'pokenav/pokemon';

<Pokenav
  position="left"
  orientation="vertical"
  items={[
    { label: 'Home', href: '/', pokemonId: 133 },
    { label: 'Work', href: '/work', pokemonId: 81 },
  ]}
/>;
```

If you want a handful of the bundled sprites *without* the catalogue, import them directly
from the package and pass them as `spriteUrl`. That form is statically analyzable, so your
bundler emits exactly the sprites you named and nothing else — and it server-renders:

```tsx
import { Pokenav } from 'pokenav';
import eevee from 'pokenav/sprites/133.png';

<Pokenav
  position="left"
  orientation="vertical"
  items={[{ label: 'Home', href: '/', spriteUrl: eevee, alt: 'Eevee — Home' }]}
/>;
```

## Fixed rail

The layout this component was built for: a nav pinned to the side of the page, vertically
centered in the space below a sticky header, hidden where there's no room for it.

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { Pokenav } from 'pokenav';

export function Rail() {
  return (
    <div className="nav-rail">
      <Pokenav
        position="left"
        orientation="vertical"
        items={items}
        activeHref={usePathname()}
        matchActive="prefix"
      />
    </div>
  );
}
```

```css
.nav-rail {
  position: fixed;
  left: 2rem;
  /*
   * Centered in the space *below* the header, not in the viewport. Centering in the
   * viewport puts the middle of the rail behind a sticky header on short screens.
   * `dvh` rather than `vh` so mobile browser chrome collapsing doesn't shift it.
   */
  top: calc(var(--header-height) + (100dvh - var(--header-height)) / 2);
  transform: translateY(-50%);
  /* Above page content, below whatever layer your modals use. */
  z-index: 10;
}

/*
 * Below this width the rail would overlap the content it's navigating. `display: none`
 * rather than `opacity: 0` or `visibility: hidden` — it must leave the tab order too, or
 * keyboard users tab through an invisible nav.
 */
@media (max-width: 900px) {
  .nav-rail {
    display: none;
  }
}
```

**Tab order follows the DOM, not the screen.** A fixed rail is usually mounted at the end
of a layout, next to the other overlays — which puts it *after* the entire page in the tab
sequence, even though it reads as the first thing on screen. Render it before `<main>` in
source order, or pair it with a skip link. Position is a paint-time concern; focus order
isn't.

## Active route

`activeHref` is a plain string prop. The component compares it against each item's `href`
and does nothing else — no router import, no history subscription, no framework coupling.
You decide where the string comes from:

```tsx
// Next.js App Router
'use client';
import { usePathname } from 'next/navigation';
<Pokenav {...config} activeHref={usePathname()} />;

// Next.js Pages Router
<Pokenav {...config} activeHref={useRouter().pathname} />;

// React Router
<Pokenav {...config} activeHref={useLocation().pathname} />;

// Scroll-spy over sections on a single page
<Pokenav {...config} activeHref={visibleSectionId} />;
```

Omit it and no node is active. The package ships with a `'use client'` directive, so it
drops into a server component without wrapping.

### Matching

`matchActive` decides how `href` and `activeHref` are compared. Defaults to `'exact'`.

```tsx
<Pokenav {...config} activeHref={pathname} matchActive="prefix" />
```

`'prefix'` keeps a section's node lit on its sub-pages — `/blog` stays active on
`/blog/some-post`. It handles the cases a bare `startsWith` gets wrong: `/` matches only
`/` rather than lighting up on every page, `/blog` does not claim `/blogroll`, and trailing
slashes, query strings and hashes are normalized away.

For anything else, pass a function:

```tsx
matchActive={(itemHref, activeHref) => activeHref.startsWith(`/en${itemHref}`)}
```

## Styling

The rendered markup carries `data-*` attributes that are the **stable public contract** for
external styling — `data-pallet`, `data-position`, `data-orientation`, `data-ring-style`,
`data-trail-path`, `data-pallet-node`, `data-active`, `data-reached`, `data-scroll-fill`,
`data-pallet-ring`, `data-pallet-sprite`, `data-pallet-label`. Target those rather than the
internal class names:

```css
[data-pallet-node][data-active] [data-pallet-ring] {
  border-style: double;
}
```

Every selector in the package stylesheet is wrapped in `:where()`, so it contributes zero
specificity from its own class names. Your overrides win whether you import
`pokenav/styles.css` before or after your global CSS.

## API

### `NavConfig`

| Field         | Type                          | Notes                                    |
| ------------- | ----------------------------- | ---------------------------------------- |
| `position`    | `'left' \| 'center' \| 'right'` | Which edge the trail anchors to.       |
| `orientation` | `'vertical' \| 'horizontal'`  | Which axis the trail runs along.         |
| `items`       | `NavItem[]`                   | One node per item.                       |
| `theme`       | `NavTheme`                    | Optional; see below.                     |
| `matchActive` | `'exact' \| 'prefix' \| fn`   | How `activeHref` is matched. Default `'exact'`. |

### `NavItem`

| Field       | Type                       | Notes                                                |
| ----------- | -------------------------- | ---------------------------------------------------- |
| `label`     | `string`                   | Visible label, and the section half of the sprite alt text. |
| `href`      | `string`                   | Compared against the active route.                   |
| `spriteUrl` | `string \| { src: string }` | Any image, or a static import. Wins over `pokemonId`. |
| `alt`       | `string`                   | Explicit accessible name for the sprite. See below.  |
| `pokemonId` | `number`                   | National Dex id, 1–898. **Requires `pokenav/pokemon`.** |

Without `alt`, the accessible name depends on how the sprite resolved: `pokemonId` gives
`"Eevee — Home"`, `spriteUrl` gives `"Home"`. Set `alt` for one consistent name whichever
path an item uses. Set it to `''` to mark the sprite decorative, which hands the accessible
name back to the visible label.

### `NavTheme`

| Field          | Type                              | Default     |
| -------------- | --------------------------------- | ----------- |
| `accentColor`  | `string`                          | `#64748b`   |
| `surfaceColor` | `string`                          | `Canvas`    |
| `ringStyle`    | `'solid' \| 'pokeball'`           | `'solid'`   |
| `trailPath`    | `'straight' \| 'wavy'`            | `'straight'`|
| `dotStyle`     | `'dotted' \| 'dashed' \| 'solid'` | `'dotted'`  |
| `font`         | `string`                          | `'inherit'` |

`accentColor` is the single source of truth for the active ring, hover ring, inactive ring,
trail, and focus ring — no color is hardcoded, so the nav matches any consumer's brand.

`surfaceColor` is the background you paint behind the nav, and only `ringStyle: 'pokeball'`
reads it. That ring has colors of its own, and an inactive node recedes by mixing its red
and white halves toward this value rather than by dropping opacity — a white half at 40%
opacity over a dark background reads as a glow around the node, not a dimmed ring. The
default is the `Canvas` system color, which already follows the page's `color-scheme`, so
if your dark theme sets `color-scheme: dark` you need not touch this. If it doesn't, set
`surfaceColor` to the color you actually paint. The pokéball red and white are still
overridable directly via `--pallet-pokeball-red` / `--pallet-pokeball-white`.

### Scroll-linked trail fill

Pass `scrollProgress` (0–1) and the trail fills continuously in `accentColor` as the value
rises. It's a separate layer from the active node — both show at once.

Like `activeHref`, it's supplied by you rather than read off `window` internally, so the
component still works inside a scroll container, a virtualized list, or driven by something
that isn't scroll at all. For the ordinary page-scroll case:

```tsx
import { Pokenav, useScrollProgress } from 'pokenav';

<Pokenav {...config} scrollProgress={useScrollProgress()} />;
```

`useScrollProgress(ref)` tracks a scrollable element instead of the document. Under
`prefers-reduced-motion` the fill still tracks scroll, it just stops animating between
values — it's a position readout, so removing it would remove information.

With `scrollProgress` set, the highlight travels with the fill: exactly one node is lit at a
time, and it moves as the trail reaches each node (marked `data-reached`). Ring, glow, scale
and label weight move together, so a node the trail has passed goes back to looking like any
other — the route-active node hands its highlight over completely rather than competing with
it. The route is still exposed as `aria-current="page"` for assistive technology.

Without `scrollProgress`, the highlight stays on the active node as before.

### Orientation and position

These are independent axes. `orientation` is which way the trail runs; `position` is which
edge it anchors to. Every combination works.

`position: 'center'` centers the trail — a plain `justify-content` in horizontal, which is
the usual case for a top nav. In vertical it centers the list as a block rather than each
item, because items are as wide as their labels and centering them individually would put
every ring at a different x and zigzag the trail.

In horizontal, labels sit **below** the node rather than flipping with `position` — beside
the node would put the trail straight through the neighbouring label's text, and
'left'/'right' say nothing about above/below. `position` controls which end the trail packs
to instead.

### Trail paths

`trailPath: 'straight'` draws the trail as a CSS border. `'wavy'` draws it as an SVG curve
through the node centers. Both render in server HTML: the wavy path is computed from the
stylesheet's own geometry constants, so it's there in the first paint rather than
straightening out and then curving after hydration. Layout is still measured afterward, and
the path redraws only if the real geometry disagrees — which it will if you've overridden
`--pallet-node-size`, `--pallet-gap`, or `--pallet-wave-amplitude`, or your root font size
isn't 16px.

### Extra props

| Prop             | Type     | Notes                                                    |
| ---------------- | -------- | -------------------------------------------------------- |
| `activeHref`     | `string` | Current route. Omit and no node is active.               |
| `scrollProgress` | `number` | 0–1. Fills the trail. Omit and no fill layer renders.    |
| `ariaLabel`      | `string` | Landmark name. Defaults to `'Site navigation'`.          |
| `className`      | `string` | Applied to the root `<nav>`.                             |

### CSS custom properties

Set these on the root element to adjust geometry without forking the stylesheet:

| Property                     | Default   |
| ---------------------------- | --------- |
| `--pallet-node-size`         | `64px`    |
| `--pallet-sprite-size`       | `36px`    |
| `--pallet-gap`               | `1.75rem` |
| `--pallet-duration`          | `160ms`   |
| `--pallet-ring-thickness`    | `3px`     |
| `--pallet-pokeball-thickness`| `6px`     |
| `--pallet-wave-amplitude`    | `12px`    |
| `--pallet-surface`           | `Canvas`  |

If you change node, sprite, or pokéball thickness, keep
`node - 2 x thickness >= sprite x 1.415` — the sprite box is a square inside a circle, so
its corners are the binding constraint. Violate it and the ring crops the artwork.

## Debugging

In development the component warns on the console when a node's sprite can't be resolved —
a `pokemonId` that isn't in the catalogue, a `spriteUrl` that came back as something other
than a string or `{ src }`, an item with neither, or `pokemonId` on the core entry point.
All four render the same empty ring, and two of them look exactly like "the image hasn't
loaded yet". The warnings compile out of production builds.

## Sprite catalogue

898 sprites ship with the package — National Dex ids 1–898, generations 1–8. Generation 9
has no icon-style sprite in the upstream source, so those ids are absent rather than filled
in with a mismatched style.

Through `pokenav/pokemon`, sprites load with a dynamic `import()` per id, so **no sprite
data lands in your JS bundle** and the browser only fetches the ones your `NavConfig`
actually names. On the docs site, a config naming 4 sprites downloads exactly 4 of the 898.
Your bundler still *emits* all 898 as separately-loadable assets — see
[Two entry points](#two-entry-points) for why, and for how to avoid it.

**Hydration behaviour worth knowing:** because `pokemonId` sprites resolve through a dynamic
import, they are absent from server-rendered HTML and appear after hydration. Nodes render
label-only until then — the ring and the trail still draw, so the layout does not shift, but
the artwork pops in. That is the cost of not inlining 898 sprites into your bundle. If you
need a sprite present in the initial HTML, import it directly and pass it as `spriteUrl`.

`catalogue.json` (`{ id, name, generation, iconAsset, types }`) is exported for building
your own picker:

```ts
import { catalogue } from 'pokenav/pokemon';
```

Bundled sprites are fan-derived Pokémon artwork, not original work, and are **not** covered
by this package's MIT license. They rely on the same fan-tolerance precedent as PokéAPI —
a precedent, not a legal guarantee.

Read **[SPRITES-NOTICE.md](https://github.com/Pgramer1/pokenav/blob/main/SPRITES-NOTICE.md)**
before shipping anything commercial. A copy also ships inside this package, so it is
available offline in `node_modules/pokenav/SPRITES-NOTICE.md`.

Using `spriteUrl` on every item — the default `pokenav` entry point — avoids the question
entirely.

## License

MIT (code). See the sprite notice above for assets.
