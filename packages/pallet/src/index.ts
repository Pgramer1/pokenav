/**
 * `pokenav` — the core entry point. Reach for this one by default.
 *
 * Everything here resolves sprites through `spriteUrl` only. Nothing in this module's
 * import graph touches `catalogue.json` or the sprite loader, which is what keeps the 898
 * bundled sprites — and the ~894 wrapper chunks a bundler emits for their import context —
 * out of builds that never ask for a Pokémon.
 *
 * Want `pokemonId`? Import the same component from `pokenav/pokemon`.
 */
import { Pokenav } from './Pokenav';

export { Pokenav };
export { DEFAULT_THEME, resolveTheme } from './defaults';
export { usePrefersReducedMotion } from './usePrefersReducedMotion';
export { useScrollProgress } from './useScrollProgress';
export { useSectionProgress } from './useSectionProgress';

export type { SectionProgress, SectionProgressOptions } from './useSectionProgress';

export type {
  Catalogue,
  CatalogueEntry,
  DotStyle,
  MatchActive,
  NavConfig,
  NavGeometry,
  NavItem,
  NavOrientation,
  NavPosition,
  NavTheme,
  PokenavProps,
  ResolvedNavTheme,
  RingStyle,
  SpriteSource,
  TrailPath,
} from './types';

/**
 * @deprecated Renamed to `Pokenav` in 0.2.0, so the component's name matches the package's.
 * This alias is the same component and will be **removed in the next major version** —
 * switch the import name at your convenience.
 *
 * Note that if you were passing `pokemonId`, renaming is not enough on its own: sprite
 * resolution moved to the `pokenav/pokemon` entry point in the same release. Import
 * `{ Pokenav }` from `'pokenav/pokemon'` for a like-for-like replacement.
 */
export const Pallet = Pokenav;

/** @deprecated Renamed to `PokenavProps` in 0.2.0. Removed in the next major version. */
export type PalletProps = import('./types').PokenavProps;
