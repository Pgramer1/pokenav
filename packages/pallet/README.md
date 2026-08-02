# pallet

A Pokémon route-map style navigation component for React — a trail of circular nodes
connected by a dotted line, each showing a pixel-art sprite, like walking a route on the
world map.

> **Status: pre-alpha scaffold.** The API surface below is real and stable-ish; the
> rendering is a skeleton. Finished visuals, bundled sprites, and the sprite catalogue are
> still being ported over. Not published to npm yet.

## Install

```bash
npm install pallet
```

`react` and `react-dom` (>=18) are peer dependencies.

## Usage

```tsx
import { Pallet, type NavConfig } from 'pallet';

const config: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', pokemonId: 1 },
    { label: 'Work', href: '/work', pokemonId: 4 },
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

### Next.js App Router

The package ships with a `'use client'` directive, so it drops into a server component
without wrapping. Pass `usePathname()` as `activeHref` so the active node tracks the real
route — `pallet` takes no dependency on `next` itself:

```tsx
'use client';
import { usePathname } from 'next/navigation';

<Pallet {...config} activeHref={usePathname()} />;
```

Without `activeHref`, the component falls back to `window.location.pathname` after mount.

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
| `pokemonId` | `number` | National Dex id, resolved against the bundled catalogue.      |
| `spriteUrl` | `string` | Any custom image. Wins over `pokemonId`, skips the catalogue. |

### `NavTheme`

| Field         | Type                              | Default     |
| ------------- | --------------------------------- | ----------- |
| `accentColor` | `string`                          | `#64748b`   |
| `ringStyle`   | `'solid' \| 'pokeball'`           | `'solid'`   |
| `trailPath`   | `'straight' \| 'wavy'`            | `'straight'`|
| `dotStyle`    | `'dotted' \| 'dashed' \| 'solid'` | `'dotted'`  |
| `font`        | `string`                          | `'inherit'` |

`accentColor` is the single source of truth for the active ring, hover ring, and trail
color — no color is hardcoded, so the nav matches any consumer's brand.

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

Bundled sprites are fan-derived Pokémon artwork, not original work, and are **not** covered
by this package's MIT license. See
[SPRITES-NOTICE.md](https://github.com/Pgramer1/Pallet/blob/main/SPRITES-NOTICE.md).

## License

MIT (code). See the sprite notice above for assets.
