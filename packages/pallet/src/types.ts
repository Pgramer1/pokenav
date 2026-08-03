/**
 * Public type surface for `pallet`.
 *
 * Shapes here follow PALLET-PLAN.md §3. Keep them in sync — the plan is the source of
 * truth for the config API.
 */

/**
 * Which edge the trail anchors to.
 *
 * `center` centers the trail in its container: `justify-content` in horizontal, and a
 * centered fixed-width block in vertical. It also decides which side the pokéball button
 * and (in vertical) the label sit on — `center` follows `left` there.
 */
export type NavPosition = 'left' | 'center' | 'right';

/**
 * Direction the trail runs.
 *
 * `horizontal` is **not implemented yet** and currently renders vertically. The value is
 * accepted so the config shape stays stable (PALLET-PLAN.md §1).
 */
export type NavOrientation = 'vertical' | 'horizontal';

/** How the connecting trail between nodes is drawn. */
export type DotStyle = 'dotted' | 'dashed' | 'solid';

/**
 * `solid` — single-color ring derived from `accentColor`.
 * `pokeball` — two-tone red/white split ring. See PALLET-PLAN.md §3.
 */
export type RingStyle = 'solid' | 'pokeball';

/**
 * `straight` — trail rendered as a CSS border/divider.
 *
 * `wavy` — **not implemented yet.** It requires an SVG bezier `<path>` with a dash-array
 * along the curve, a different rendering approach from a CSS border rather than a style
 * toggle, and is scoped as its own piece of work. Passing it today renders the straight
 * trail; the value is accepted so the config shape stays stable.
 */
export type TrailPath = 'straight' | 'wavy';

/** A single node on the trail. */
export interface NavItem {
  /** Visible label, and the section half of the sprite's alt text. */
  label: string;
  /** Destination. Compared against the active route to decide the active node. */
  href: string;
  /** National Dex id, resolved against the bundled catalogue. */
  pokemonId?: number;
  /**
   * Escape hatch: any custom sprite/icon URL. Takes precedence over `pokemonId`, and
   * skips the bundled Pokémon catalogue entirely.
   */
  spriteUrl?: string;
}

/** Visual theming. Every value is optional and falls back to {@link DEFAULT_THEME}. */
export interface NavTheme {
  /**
   * Single source of truth for active ring, hover ring, and trail color. Nothing in the
   * component hardcodes a color — it all derives from this.
   */
  accentColor?: string;
  ringStyle?: RingStyle;
  trailPath?: TrailPath;
  dotStyle?: DotStyle;
  /** CSS `font-family` value applied to labels. */
  font?: string;
}

/** Top-level configuration for the nav. */
export interface NavConfig {
  position: NavPosition;
  orientation: NavOrientation;
  items: NavItem[];
  theme?: NavTheme;
}

/** Theme with every field filled in. */
export type ResolvedNavTheme = Required<NavTheme>;

/** One entry in the bundled sprite catalogue (`catalogue.json`). */
export interface CatalogueEntry {
  /** National Dex id. Matches `NavItem.pokemonId`. */
  id: number;
  /** Lowercase species name, e.g. `"bulbasaur"`. Used in alt text. */
  name: string;
  /** Generation the species was introduced in, 1–8. What the picker filters on. */
  generation: number;
  /** Path to the sprite file, relative to the package root. */
  iconAsset: string;
  /** Pokémon types, e.g. `["grass", "poison"]`. */
  types: string[];
}

/** Shape of `catalogue.json`. */
export interface Catalogue {
  /** Bumped when the entry shape changes, so generators can migrate. */
  version: number;
  entries: CatalogueEntry[];
}
