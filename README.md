# pokenav

A Pokémon route-map style navigation component for React. A trail of circular nodes
connected by a dotted line, each node showing a pixelated sprite for a page or section —
like walking a route on the world map.

**[Playground and docs → pokenav.devanshsoni.com](https://pokenav.devanshsoni.com)** ·
**[pokenav on npm](https://www.npmjs.com/package/pokenav)**

```bash
npm install pokenav
```

> **Status: published on npm.** The config API is settled and everything documented is
> implemented — both ring styles, both trail paths, both orientations, accent-colour
> theming, scroll-linked trail fill, and the full 898-sprite catalogue behind the
> interactive picker.

The published package is **`pokenav`**. The workspace folder is still `packages/pallet`,
after Pallet Town where every journey starts — the internal layout doesn't have to match the
published name. (`pallet` on npm was taken by an abandoned PureScript package manager, which
is why the published name moved.)

## Repo layout

```
packages/pallet/   pokenav — source, types, 898 bundled sprites, catalogue
apps/docs/         Next.js docs site — playground, sprite picker, written usage docs
scripts/           build-catalogue.mjs — regenerates catalogue.json from PokéAPI data
```

npm workspaces, no monorepo task runner. See [PALLET-PLAN.md](PALLET-PLAN.md) for the full
design plan, decisions, and build phases — it's the source of truth for this project.

For the component's own API reference, see
[packages/pallet/README.md](packages/pallet/README.md) — that's the README published to npm.

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
| `npm run build:docs`    | Builds the package, then the docs site.               |
| `npm run clean`         | Removes build output.                                 |

The docs app consumes `pokenav` from `dist/`, so run `npm run build` at least once before
`npm run dev`. For live iteration on the component, run `npm run dev:pallet` alongside it.

No test framework is configured — there is nothing to run.

## Releasing

The package publishes from `packages/pallet`, and `prepublishOnly` runs the build, so the
tarball can never contain stale `dist/` output:

```bash
cd packages/pallet
npm publish --otp=<code>
```

npm requires 2FA (or a granular access token with 2FA bypass) to publish. Run
`npm publish --dry-run` first to inspect the tarball contents without touching the registry.

## Sprite assets and licensing

The code in this repo is MIT licensed — see [LICENSE](LICENSE).

The Pokémon sprite assets bundled with the package are **not** original work and are **not**
covered by that license. Read **[SPRITES-NOTICE.md](SPRITES-NOTICE.md)** for the full
disclosure, the fan-tool precedent it relies on, and its limits. Every nav item accepts a
`spriteUrl`, so you can use the component with entirely your own artwork and skip the
bundled sprites completely.

Pokémon and all associated names are trademarks of Nintendo, Creatures Inc., GAME FREAK
inc., and The Pokémon Company. This project is not affiliated with or endorsed by them.
