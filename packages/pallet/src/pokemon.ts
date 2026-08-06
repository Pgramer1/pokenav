/**
 * `pokenav/pokemon` — the core component plus Pokémon sprite resolution.
 *
 * Importing from here adds `pokemonId` support, `catalogue.json`, and the dynamic-import
 * context over the bundled sprites. Only the ids a config names are ever *fetched*, but
 * your bundler emits a loadable chunk for each of the 898 because it cannot know which
 * numeric ids a runtime config will use. That build-output cost is the whole reason this is
 * a separate entry point — see the README.
 *
 * Everything the core entry point exports is re-exported here, so `pokenav/pokemon` can be
 * a single drop-in import rather than forcing consumers to import from both.
 */
export { Pokenav } from './PokemonNav';

export { catalogue, getCatalogueEntry } from './catalogue';
export { getLoadedSprite, loadSprite } from './sprites';
export { useSpriteUrls } from './useSpriteUrls';

export { DEFAULT_THEME, resolveTheme } from './defaults';
export { usePrefersReducedMotion } from './usePrefersReducedMotion';
export { useScrollProgress } from './useScrollProgress';

export type {
  Catalogue,
  CatalogueEntry,
  DotStyle,
  MatchActive,
  NavConfig,
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

import { Pokenav } from './PokemonNav';

/**
 * @deprecated Renamed to `Pokenav` in 0.2.0, so the component's name matches the package's.
 * This alias is the same component and will be **removed in the next major version**.
 *
 * If you are upgrading from 0.1.x and use `pokemonId`, this is the drop-in: the import path
 * changes from `'pokenav'` to `'pokenav/pokemon'`, the name stays `Pallet` for now.
 */
export const Pallet = Pokenav;

/** @deprecated Renamed to `PokenavProps` in 0.2.0. Removed in the next major version. */
export type PalletProps = import('./types').PokenavProps;
