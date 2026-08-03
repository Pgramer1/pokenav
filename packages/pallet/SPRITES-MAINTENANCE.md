# sprites/

Four sprites are bundled so far, ported from the devanshsoni.com build: magnemite (81),
eevee (133), porygon (137), sudowoodo (185). Each is registered in `catalogue.json` and
inlined as a `data:` URI at build time via `src/sprites.ts`.

Curating the full set is PALLET-PLAN.md §7 and hasn't happened yet. A `pokemonId` with no
bundled sprite renders label-only rather than breaking.

## When adding sprites

- **Curate, don't dump.** A hand-picked set that reads well at ~40x40 beats all ~1000
  Pokémon (PALLET-PLAN.md §7, §9). Anything muddy at icon size doesn't earn a slot.
- **Icon-size, not battle sprites.** Full battle sprites lose legibility at nav scale.
- **Normalize the bounding box.** Scale and center each sprite so every node carries equal
  visual weight inside its circle (PALLET-PLAN.md §4).
- **Register each one in two places:** `catalogue.json` as `{ id, name, iconAsset, types }`
  (where `iconAsset` is the path relative to the package root), and `src/sprites.ts` so it
  gets inlined. These are hand-maintained and must stay in sync — once the set grows past a
  handful, generate both from one source rather than editing them by hand.
- **Ship them in the tarball.** `sprites` is already listed in `package.json#files` and
  exposed via the `./sprites/*` export, so no packaging change is needed.

## Licensing

These assets are fan-derived Pokémon artwork and are **not** covered by this project's MIT
license. Read `SPRITES-NOTICE.md` at the repo root before adding anything here.
