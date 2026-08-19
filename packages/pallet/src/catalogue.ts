import catalogueData from '../catalogue.json';
import type { Catalogue, CatalogueEntry } from './types';

/**
 * The bundled sprite catalogue.
 *
 * Generated with the 898 shipped sprites; see `packages/pallet/SPRITES-MAINTENANCE.md`.
 * Items using `spriteUrl` never consult this.
 */
export const catalogue: Catalogue = catalogueData as Catalogue;

const byId = new Map<number, CatalogueEntry>(
  catalogue.entries.map((entry) => [entry.id, entry]),
);

/** Look up a catalogue entry by National Dex id. */
export function getCatalogueEntry(pokemonId: number): CatalogueEntry | undefined {
  return byId.get(pokemonId);
}
