# Changelog

## 0.1.1

Documentation only — no runtime behaviour changed.

- Corrected `NavOrientation` and `TrailPath` doc comments, which shipped in the 0.1.0
  `.d.ts` claiming `horizontal` and `wavy` were unimplemented. Both have been implemented
  since the theme-variant phase; the comments were left over from when the config shape was
  defined ahead of the rendering work. They surfaced as IDE tooltips on install.

## 0.1.0

First public release.

- `Pallet` component: a trail of circular sprite nodes for page or section navigation.
- Ring styles `solid` and `pokeball`; trail paths `straight` (CSS border) and `wavy`
  (SVG path through measured node centers).
- Both orientations (`vertical`, `horizontal`) and three positions (`left`, `center`,
  `right`), independently combinable.
- `accentColor` theming — one value drives active ring, hover ring, inactive ring, trail and
  focus ring, with no hardcoded colours.
- Scroll-linked trail fill via the `scrollProgress` prop, with the highlight travelling to
  the reached node.
- No ambient state: `activeHref` and `scrollProgress` are plain props, so the component works
  inside scroll containers, virtualized lists and embedded panels. `useScrollProgress()` is
  exported as an opt-in convenience.
- 898 bundled sprites (National Dex 1–898, generations 1–8), lazily loaded one dynamic
  `import()` per id, so only the sprites a config names are fetched.
- `spriteUrl` on any item bypasses the bundled catalogue entirely.
- Self-contained plain-CSS styling exported as `pokenav/styles.css`; `data-*` attributes are
  the public styling contract.
