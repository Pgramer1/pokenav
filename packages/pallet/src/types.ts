/**
 * Public type surface for `pokenav`.
 *
 * Shapes here follow PALLET-PLAN.md §3. Keep them in sync — the plan is the source of
 * truth for the config API.
 *
 * These types are shared by both entry points. `pokenav` resolves `spriteUrl` only;
 * `pokenav/pokemon` additionally resolves `pokemonId` against the bundled catalogue. The
 * shape is deliberately one type rather than two, so a `NavConfig` stays portable between
 * them and consumers do not have to pick a type per import path.
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
 * Independent of {@link NavPosition}: `orientation` is which way the trail runs, `position`
 * is which edge it anchors to. Every combination works.
 *
 * In `horizontal`, labels sit *below* the node rather than flipping with `position` —
 * beside the node would run the trail through the neighbouring label's text.
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
 * `straight` — trail rendered as a CSS border/divider. Needs no measurement, so it survives
 * server rendering and no-JS.
 *
 * `wavy` — an SVG path drawn through node centers. It server-renders from the configured
 * geometry, then layout measurement corrects it only when consumer CSS changes that shape.
 */
export type TrailPath = 'straight' | 'wavy';

/**
 * A sprite reference.
 *
 * Either a plain URL string, or the object form a bundler hands back for a statically
 * imported image — Next.js returns `StaticImageData` (`{ src, width, height, … }`) rather
 * than a string. Both are accepted and normalized to a URL, so
 * `import icon from './icon.png'` can be passed straight through without the consumer
 * having to know which shape their bundler produced. The same import can even resolve to
 * *different* shapes in one app: a package-subpath PNG comes back as a bare string under
 * Turbopack while a local one comes back as `StaticImageData`.
 */
export type SpriteSource = string | { src: string };

/**
 * How an item's `href` is compared against `activeHref`.
 *
 * `exact` — plain string equality. The default, and what every version before 0.2 did.
 *
 * `prefix` — the item is active for its own route and anything nested beneath it, so a
 * `/blog` node stays lit on `/blog/some-post`. Segment-aware and root-aware: `/blog` does
 * not match `/blogroll`, and `/` matches only `/` rather than lighting up every node on
 * every page. Trailing slashes are normalized and a query or hash on `activeHref` is
 * ignored, so `/blog/` and `/blog?page=2` behave as you would expect.
 *
 * A function takes over completely, for anything else — locale prefixes, hash routing,
 * section scroll-spy.
 */
export type MatchActive =
  | 'exact'
  | 'prefix'
  | ((itemHref: string, activeHref: string) => boolean);

/** A single node on the trail. */
export interface NavItem {
  /** Visible label, and the section half of the sprite's alt text. */
  label: string;
  /** Destination. Compared against the active route to decide the active node. */
  href: string;
  /**
   * National Dex id, resolved against the bundled catalogue.
   *
   * Only resolved by the `pokenav/pokemon` entry point — the core `pokenav` entry ships
   * neither the catalogue nor the sprite chunks, and warns in development if an item sets
   * this. See the README on choosing an entry point.
   */
  pokemonId?: number;
  /**
   * Escape hatch: any custom sprite/icon image. Takes precedence over `pokemonId`, and
   * skips the bundled Pokémon catalogue entirely.
   *
   * This is the only sprite path the core `pokenav` entry point supports, and the only one
   * that renders in server-side HTML.
   */
  spriteUrl?: SpriteSource;
  /**
   * Explicit accessible name for this node's sprite, overriding the derived one.
   *
   * Without it the accessible name depends on how the sprite resolved: `pokemonId` yields
   * `"{Pokémon name} — {label}"` while `spriteUrl` yields just the label. Set `alt` when
   * you want one consistent name whichever path an item uses, or when the species name is
   * noise for your readers.
   *
   * Set it to `''` to mark the sprite decorative; the visible label then stays exposed to
   * assistive technology and carries the accessible name instead.
   */
  alt?: string;
}

/**
 * Node geometry, in CSS pixels.
 *
 * The same three numbers as `--pallet-node-size`, `--pallet-gap` and
 * `--pallet-wave-amplitude`, and setting them here rather than in CSS is what makes an
 * override server-renderable. The wavy trail is computed before layout exists, from the
 * stylesheet's *default* values — a `--pallet-gap` overridden in your CSS is invisible to
 * that computation, so the server draws a curve at the wrong pitch and the browser
 * corrects it on first paint. Values given here are used for the computation *and* emitted
 * as inline custom properties, so CSS and JS cannot disagree about them.
 *
 * Only worth reaching for if you both override the geometry and care about the first
 * frame; overriding in CSS still works and still ends up correct, one redraw later.
 */
export interface NavGeometry {
  /** `--pallet-node-size` — diameter of a node's ring. */
  nodeSize?: number;
  /** `--pallet-gap` — space between two nodes. */
  gap?: number;
  /** `--pallet-wave-amplitude` — peak lateral deviation of a `wavy` trail. */
  waveAmplitude?: number;
}

/** Visual theming. Every value is optional and falls back to {@link DEFAULT_THEME}. */
export interface NavTheme {
  /**
   * Single source of truth for active ring, hover ring, and trail color. Nothing in the
   * component hardcodes a color — it all derives from this.
   */
  accentColor?: string;
  /**
   * The background the nav is sitting on.
   *
   * Only the `pokeball` ring style reads it, and it exists because that ring is the one
   * part of the component with colors of its own: an inactive node recedes by mixing its
   * red and white halves *toward this color* rather than by dropping opacity. Opacity
   * assumes a light surface — a white half at 40% opacity over a dark background reads as
   * a glow around the node instead of a dimmed ring.
   *
   * Defaults to the `Canvas` system color, which already follows the page's
   * `color-scheme`. If your dark theme doesn't set `color-scheme: dark`, set this to the
   * background color you actually paint.
   */
  surfaceColor?: string;
  ringStyle?: RingStyle;
  trailPath?: TrailPath;
  dotStyle?: DotStyle;
  /** CSS `font-family` value applied to labels. */
  font?: string;
  /**
   * Node geometry overrides that the server-rendered trail can see. See {@link NavGeometry}.
   */
  geometry?: NavGeometry;
}

/** Top-level configuration for the nav. */
export interface NavConfig {
  position: NavPosition;
  orientation: NavOrientation;
  items: NavItem[];
  theme?: NavTheme;
  /**
   * How `activeHref` is matched against each item's `href`. Defaults to `'exact'`.
   *
   * See {@link MatchActive}.
   */
  matchActive?: MatchActive;
}

/**
 * Props for the `Pokenav` component, from either entry point.
 *
 * `NavConfig` plus the two ambient values the component deliberately refuses to source
 * itself, and the usual escape hatches.
 */
export interface PokenavProps extends NavConfig {
  /**
   * The href of the currently active route.
   *
   * Deliberately a plain prop with no router coupling: the component does a string
   * comparison and nothing else. The consumer decides how to compute it — `usePathname()`
   * in the Next App Router, `useRouter().pathname` in Pages, `useLocation()` in React
   * Router, a static string in a one-page site, or their own scroll-spy for section
   * navigation. Omit it and no node is active.
   */
  activeHref?: string;
  /**
   * Scroll position as a 0–1 fraction. Progressively fills the trail in `accentColor`.
   *
   * Same reasoning as `activeHref`: sourced from the consumer rather than read off
   * `window` internally, so the component works anywhere — inside a scroll container, a
   * virtualized list, an embedded panel, or driven by something that isn't scroll at all.
   * `useScrollProgress()` is exported for the ordinary page-scroll case.
   *
   * Omit it and no fill layer renders. When present, the reached node becomes the current
   * visual and accessible stop; route matches remain available through `data-active`.
   */
  scrollProgress?: number;
  /** Accessible name for the `<nav>` landmark. */
  ariaLabel?: string;
  /** Merged onto the root element's own class. */
  className?: string;
}

/** Theme with every field filled in. */
export type ResolvedNavTheme = Required<Omit<NavTheme, 'geometry'>> & {
  geometry: Required<NavGeometry>;
};

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
