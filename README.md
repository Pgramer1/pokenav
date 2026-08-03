# pokenav

A Pokémon route-map style navigation component for React. A trail of circular nodes
connected by a dotted line, each node showing a pixelated sprite for a page or section —
like walking a route on the world map.

The published package is **`pokenav`**. The repo and the workspace folder are still named
`pallet`, after Pallet Town where every journey starts — the internal layout doesn't have to
match the published name.

> **Status: pre-alpha.** Workspace, build tooling, and docs app are wired up and building.
> The component renders with its base look and four bundled sprites. Theme variants and the
> sprite picker are still ahead. Nothing is published to npm yet — the package is
> `pokenav`.

## Repo layout

```
packages/pallet/   pokenav — source, types, bundled sprites, catalogue
apps/docs/         Next.js docs site — will host the sprite picker and live demo
```

npm workspaces, no monorepo task runner. See [PALLET-PLAN.md](PALLET-PLAN.md) for the full
design plan, decisions, and build phases — it's the source of truth for this project.

## Getting started

```bash
npm install          # installs all workspaces
npm run build        # builds packages/pallet (ESM + CJS + .d.ts via tsup)
npm run dev          # runs the docs site at http://localhost:3000
```

Other scripts:

| Command                 | Does                                                  |
| ----------------------- | ----------------------------------------------------- |
| `npm run build:all`     | Builds every workspace that defines a build script.   |
| `npm run dev:pallet`    | Rebuilds the package on change (`tsup --watch`).      |
| `npm run typecheck`     | Typechecks every workspace.                           |
| `npm run clean`         | Removes build output.                                 |

The docs app consumes `pallet` from `dist/`, so run `npm run build` at least once before
`npm run dev`. For live iteration on the component, run `npm run dev:pallet` alongside it.

## Sprite assets and licensing

The code in this repo is MIT licensed — see [LICENSE](LICENSE).

The Pokémon sprite assets bundled with the package are **not** original work and are **not**
covered by that license. Read **[SPRITES-NOTICE.md](SPRITES-NOTICE.md)** for the full
disclosure, the fan-tool precedent it relies on, and its limits. Every nav item accepts a
`spriteUrl`, so you can use the component with entirely your own artwork and skip the
bundled sprites completely.

Pokémon and all associated names are trademarks of Nintendo, Creatures Inc., GAME FREAK
inc., and The Pokémon Company. This project is not affiliated with or endorsed by them.
