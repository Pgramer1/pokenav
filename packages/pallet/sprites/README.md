# sprites/

No sprite assets are committed yet.

Sprite assets land here once they're ported over from the devanshsoni.com build
(PALLET-PLAN.md §8, phase 3) and registered in `catalogue.json`. Until then
`catalogue.json` has an empty `entries` array, `getCatalogueEntry()` returns `undefined`
for every id, and nav items render label-only unless they supply their own `spriteUrl`.

## When adding sprites

- **Curate, don't dump.** A hand-picked set that reads well at ~40x40 beats all ~1000
  Pokémon (PALLET-PLAN.md §7, §9). Anything muddy at icon size doesn't earn a slot.
- **Icon-size, not battle sprites.** Full battle sprites lose legibility at nav scale.
- **Normalize the bounding box.** Scale and center each sprite so every node carries equal
  visual weight inside its circle (PALLET-PLAN.md §4).
- **Register each one in `catalogue.json`** as `{ id, name, iconAsset, types }`, where
  `iconAsset` is the path relative to the package root — e.g. `sprites/001-bulbasaur.png`.
- **Ship them in the tarball.** `sprites` is already listed in `package.json#files` and
  exposed via the `./sprites/*` export, so no packaging change is needed.

## Licensing

These assets are fan-derived Pokémon artwork and are **not** covered by this project's MIT
license. Read `SPRITES-NOTICE.md` at the repo root before adding anything here.
