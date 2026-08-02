# pallet

A Pokémon route-map style navigation component for React — a trail of circular nodes
connected by a dotted line, each showing a pixel-art sprite, like walking a route on the
world map.

> **Status: pre-alpha.** The config API is settled and the base look is in place. The
> catalogue currently bundles four sprites. Theme variants (`ringStyle: 'pokeball'`,
> `trailPath: 'wavy'`) and horizontal orientation are declared but not implemented. Not
> published to npm yet.

## Install

```bash
npm install @devanshsoni/pallet
```

`react` and `react-dom` (>=18) are peer dependencies.

## Usage

```tsx
import { Pallet, type NavConfig } from '@devanshsoni/pallet';
import '@devanshsoni/pallet/styles.css';

const config: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', pokemonId: 133 },
    { label: 'Work', href: '/work', pokemonId: 81 },
    { label: 'Contact', href: '/contact', spriteUrl: '/icons/custom.png' },
  ],
  theme: {
    accentColor: '#f97316',
    dotStyle: 'dotted',
  },
};

export function Nav() {
  return <Pallet {...config} />;
}
```

Import the stylesheet once, anywhere in your app (in Next.js App Router, your root
layout). It's plain CSS with scoped class names — no Tailwind, no framework coupling, and
nothing to configure.

## Styling

The rendered markup carries `data-*` attributes that are the **stable public contract** for
external styling — `data-pallet`, `data-position`, `data-orientation`, `data-pallet-node`,
`data-active`, `data-pallet-ring`, `data-pallet-sprite`, `data-pallet-label`. Target those
rather than the internal class names:

```css
[data-pallet-node][data-active] [data-pallet-ring] {
  border-style: double;
}
```

### Active route

`activeHref` is a plain string prop. The component compares it against each item's `href`
and does nothing else — no router import, no history subscription, no framework coupling.
You decide where the string comes from:

```tsx
// Next.js App Router
'use client';
import { usePathname } from 'next/navigation';
<Pallet {...config} activeHref={usePathname()} />;

// Next.js Pages Router
<Pallet {...config} activeHref={useRouter().pathname} />;

// React Router
<Pallet {...config} activeHref={useLocation().pathname} />;

// Scroll-spy over sections on a single page
<Pallet {...config} activeHref={visibleSectionId} />;
```

Omit it and no node is active. The package ships with a `'use client'` directive, so it
drops into a server component without wrapping.

## API

### `NavConfig`

| Field         | Type                          | Notes                                    |
| ------------- | ----------------------------- | ---------------------------------------- |
| `position`    | `'left' \| 'right'`           | Which side the trail anchors to.         |
| `orientation` | `'vertical' \| 'horizontal'`  | `horizontal` is planned, not built.      |
| `items`       | `NavItem[]`                   | One node per item.                       |
| `theme`       | `NavTheme`                    | Optional; see below.                     |

### `NavItem`

| Field       | Type     | Notes                                                        |
| ----------- | -------- | ------------------------------------------------------------ |
| `label`     | `string` | Visible label, and the section half of the sprite alt text.  |
| `href`      | `string` | Compared against the active route.                           |
| `pokemonId` | `number` | National Dex id, resolved against the bundled catalogue. Currently 81, 133, 137, 185. |
| `spriteUrl` | `string` | Any custom image. Wins over `pokemonId`, skips the catalogue. |

### `NavTheme`

| Field         | Type                              | Default     |
| ------------- | --------------------------------- | ----------- |
| `accentColor` | `string`                          | `#64748b`   |
| `ringStyle`   | `'solid' \| 'pokeball'`           | `'solid'`   |
| `trailPath`   | `'straight' \| 'wavy'`            | `'straight'`|
| `dotStyle`    | `'dotted' \| 'dashed' \| 'solid'` | `'dotted'`  |
| `font`        | `string`                          | `'inherit'` |

`accentColor` is the single source of truth for the active ring, hover ring, inactive ring,
trail, and focus ring — no color is hardcoded, so the nav matches any consumer's brand. The
one exception is `ringStyle: 'pokeball'`, whose red and white are definitional to that
style; they're still overridable via `--pallet-pokeball-red` / `--pallet-pokeball-white`.

### Not implemented yet

`trailPath: 'wavy'` and `orientation: 'horizontal'` are accepted by the types so the config
shape stays stable, but currently render as `'straight'` and `'vertical'`. The wavy trail
needs an SVG bezier path with a dash-array along the curve — a different rendering approach
from a CSS border, scoped as its own piece of work.

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

If you change node, sprite, or pokéball thickness, keep
`node - 2 x thickness >= sprite x 1.415` — the sprite box is a square inside a circle, so
its corners are the binding constraint. Violate it and the ring crops the artwork.

### Extra props

| Prop        | Type     | Notes                                              |
| ----------- | -------- | -------------------------------------------------- |
| `activeHref`| `string` | Current route. Falls back to `window.location`.    |
| `ariaLabel` | `string` | Landmark name. Defaults to `'Site navigation'`.    |
| `className` | `string` | Applied to the root `<nav>`.                       |

## Using it without Pokémon

Set `spriteUrl` on every item and the bundled catalogue is never touched — you get the
route-map navigation with your own art and none of the licensing question.

## Sprite assets

Sprites are inlined as `data:` URIs at build time, so the package is self-contained: no
PokéAPI call, no CDN, no bundler configuration. The raw files are also published under
`@devanshsoni/pallet/sprites/*` if you'd rather serve them yourself.

Bundled sprites are fan-derived Pokémon artwork, not original work, and are **not** covered
by this package's MIT license. See
[SPRITES-NOTICE.md](https://github.com/Pgramer1/Pallet/blob/main/SPRITES-NOTICE.md).

## License

MIT (code). See the sprite notice above for assets.
