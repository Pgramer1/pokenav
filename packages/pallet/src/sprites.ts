import eevee from '../sprites/eevee.png';
import magnemite from '../sprites/magnemite.png';
import porygon from '../sprites/porygon.png';
import sudowoodo from '../sprites/sudowoodo.png';

/**
 * Bundled sprites, keyed by National Dex id, inlined as `data:` URIs at build time.
 *
 * Inlining is what makes PALLET-PLAN.md §2 true in practice: the package carries its own
 * artwork with no runtime dependency on PokéAPI or any CDN, and consumers need zero
 * bundler configuration to render a node. The sprites are icon-size (a few hundred bytes
 * each), so the cost is negligible at this scale.
 *
 * This map is hand-maintained and must stay in sync with `catalogue.json`. Once the
 * catalogue grows past a handful of entries, both this file and `catalogue.json` should be
 * emitted by the same generator rather than edited by hand (PALLET-PLAN.md §7).
 */
export const spriteDataUrls: Readonly<Record<number, string>> = {
  81: magnemite,
  133: eevee,
  137: porygon,
  185: sudowoodo,
};

/** Returns the inlined `data:` URI for a Dex id, if that sprite is bundled. */
export function getSpriteDataUrl(pokemonId: number): string | undefined {
  return spriteDataUrls[pokemonId];
}
