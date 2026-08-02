/**
 * One-time (re-runnable) build of the sprite catalogue.
 *
 * Downloads icon-style sprites from the PokeAPI sprite repo, trims their transparent
 * padding, writes them to packages/pallet/sprites/<id>.png, and emits catalogue.json.
 *
 *   node scripts/build-catalogue.mjs
 *
 * Provenance and the reasoning behind the choices here are recorded in PALLET-PLAN.md §7.
 * Sprite assets are fan-derived artwork, not covered by this repo's MIT license — see
 * SPRITES-NOTICE.md.
 */
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPRITE_DIR = path.join(ROOT, 'packages/pallet/sprites');
const CATALOGUE = path.join(ROOT, 'packages/pallet/catalogue.json');

/**
 * The generation-viii icon set is the only complete, consistently-styled icon-size set in
 * the source repo. Sprites are 68x56 with transparent padding; we trim that so the artwork
 * fills its box, which is what the component's sprite normalization expects.
 */
const ICON_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons';

/** Highest National Dex id worth probing. Anything above simply 404s and is skipped. */
const MAX_ID = 1025;
const BATCH_SIZE = 24;
const BATCH_PAUSE_MS = 250;
const GENERATION_COUNT = 9;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'pallet-catalogue-build' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Trailing id out of a PokeAPI resource url. */
function idFromUrl(url) {
  const match = /\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : null;
}

/**
 * Generation and type are fetched from the aggregate endpoints rather than per Pokémon:
 * 9 + ~20 requests instead of ~900. Same data, a fraction of the load on the API.
 */
async function fetchMetadata() {
  const generation = new Map();
  const names = new Map();

  for (let gen = 1; gen <= GENERATION_COUNT; gen += 1) {
    const data = await getJson(`https://pokeapi.co/api/v2/generation/${gen}`);
    for (const species of data.pokemon_species) {
      const id = idFromUrl(species.url);
      if (id === null) continue;
      generation.set(id, gen);
      names.set(id, species.name);
    }
  }

  const types = new Map();
  const typeIndex = await getJson('https://pokeapi.co/api/v2/type?limit=100');
  for (const type of typeIndex.results) {
    // "unknown" and "shadow" are not real battle types and never appear on a species.
    if (type.name === 'unknown' || type.name === 'shadow') continue;
    const data = await getJson(type.url);
    for (const entry of data.pokemon) {
      const id = idFromUrl(entry.pokemon.url);
      if (id === null) continue;
      if (!types.has(id)) types.set(id, []);
      types.get(id).push(type.name);
    }
  }

  return { generation, names, types };
}

/** Downloads one icon and trims its transparent padding. Returns null when absent. */
async function fetchSprite(id) {
  const res = await fetch(`${ICON_BASE}/${id}.png`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} for sprite ${id}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return sharp(buffer).trim().png().toBuffer();
}

async function main() {
  console.log('Fetching generation and type metadata...');
  const { generation, names, types } = await fetchMetadata();
  console.log(`  ${names.size} species, ${types.size} with types\n`);

  await mkdir(SPRITE_DIR, { recursive: true });

  const entries = [];
  const skipped = { noSprite: [], noMetadata: [] };

  for (let start = 1; start <= MAX_ID; start += BATCH_SIZE) {
    const ids = [];
    for (let id = start; id < start + BATCH_SIZE && id <= MAX_ID; id += 1) ids.push(id);

    const results = await Promise.all(
      ids.map(async (id) => ({ id, buffer: await fetchSprite(id) })),
    );

    for (const { id, buffer } of results) {
      if (!buffer) {
        skipped.noSprite.push(id);
        continue;
      }
      // A sprite with no species metadata cannot be filtered or searched, so it would be
      // dead weight in the picker.
      if (!names.has(id) || !generation.has(id)) {
        skipped.noMetadata.push(id);
        continue;
      }
      await writeFile(path.join(SPRITE_DIR, `${id}.png`), buffer);
      entries.push({
        id,
        name: names.get(id),
        generation: generation.get(id),
        iconAsset: `sprites/${id}.png`,
        types: types.get(id) ?? [],
      });
    }

    process.stdout.write(`\r  downloaded ${entries.length} sprites (probed up to ${start + ids.length - 1})`);
    await sleep(BATCH_PAUSE_MS);
  }

  entries.sort((a, b) => a.id - b.id);
  await writeFile(CATALOGUE, `${JSON.stringify({ version: 2, entries }, null, 2)}\n`);

  // Drop the old name-keyed sprites; the catalogue is keyed by id now.
  const stale = (await readdir(SPRITE_DIR)).filter((f) => f.endsWith('.png') && !/^\d+\.png$/.test(f));
  for (const file of stale) await unlink(path.join(SPRITE_DIR, file));

  const missingTypes = entries.filter((e) => e.types.length === 0);
  console.log(`\n\nWrote ${entries.length} sprites + catalogue.json (version 2)`);
  if (stale.length) console.log(`Removed ${stale.length} stale name-keyed sprite(s): ${stale.join(', ')}`);
  console.log(`Skipped ${skipped.noSprite.length} ids with no icon sprite in the source`);
  if (skipped.noSprite.length) {
    const s = skipped.noSprite;
    console.log(`  range: ${s[0]}..${s[s.length - 1]}`);
  }
  if (skipped.noMetadata.length) console.log(`Skipped ${skipped.noMetadata.length} with a sprite but no metadata: ${skipped.noMetadata.join(', ')}`);
  if (missingTypes.length) console.log(`Warning: ${missingTypes.length} entries have no types: ${missingTypes.map((e) => e.id).join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
