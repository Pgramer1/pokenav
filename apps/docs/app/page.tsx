'use client';

import { useState } from 'react';
import { Pallet, type NavConfig } from '@devanshsoni/pallet';

/**
 * Live demo for the four bundled sprites.
 *
 * Note what is NOT here: no `usePathname`, no router import. `activeHref` is ordinary
 * component state, which is the point — the component compares strings and the consumer
 * decides where the string comes from. Clicking a node here just sets that state.
 */
const items: NavConfig['items'] = [
  { label: 'Home', href: '/', pokemonId: 133 },
  { label: 'Work', href: '/work', pokemonId: 81 },
  { label: 'Writing', href: '/writing', pokemonId: 137 },
  { label: 'Contact', href: '/contact', pokemonId: 185 },
];

const ACCENTS = ['#f97316', '#2563eb', '#16a34a', '#db2777'];

export default function Home() {
  const [activeHref, setActiveHref] = useState('/');
  const [accentColor, setAccentColor] = useState(ACCENTS[0]);

  // Demo-only: intercept navigation so the page doesn't actually route away.
  const capture = (event: React.MouseEvent) => {
    const link = (event.target as HTMLElement).closest('a');
    if (!link) return;
    event.preventDefault();
    setActiveHref(new URL(link.href).pathname);
  };

  return (
    <main>
      <h1>pallet</h1>
      <p className="lede">
        A Pokémon route-map style navigation component for React. A trail of circular nodes
        connected by a dotted line, each showing a pixel-art sprite for a page or section.
      </p>

      <div className="controls">
        <span className="controlsLabel">accentColor</span>
        {ACCENTS.map((color) => (
          <button
            key={color}
            type="button"
            className="swatch"
            data-selected={color === accentColor ? '' : undefined}
            style={{ background: color }}
            onClick={() => setAccentColor(color)}
            aria-label={`Use accent ${color}`}
          />
        ))}
      </div>

      <p className="hint">
        Click a node to change the active route. Every color below comes from that one
        accent value — nothing is hardcoded.
      </p>

      <div className="demos" onClick={capture}>
        <section className="demo">
          <h2>
            ringStyle: <code>solid</code>
          </h2>
          <Pallet
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Solid ring demo"
            theme={{ accentColor, ringStyle: 'solid', dotStyle: 'dotted' }}
          />
        </section>

        <section className="demo">
          <h2>
            ringStyle: <code>pokeball</code>
          </h2>
          <Pallet
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Pokeball ring demo"
            theme={{ accentColor, ringStyle: 'pokeball', dotStyle: 'dashed' }}
          />
        </section>

        <section className="demo">
          <h2>
            position: <code>right</code>
          </h2>
          <Pallet
            position="right"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Right position demo"
            theme={{ accentColor, ringStyle: 'solid', dotStyle: 'solid' }}
          />
        </section>
      </div>

      <h2>Custom sprites, no Pokémon</h2>
      <p className="hint">
        Every item takes a <code>spriteUrl</code>, so the component works with entirely your
        own artwork and never touches the bundled catalogue.
      </p>
      <div className="demos" onClick={capture}>
        <section className="demo">
          <Pallet
            position="left"
            orientation="vertical"
            activeHref={activeHref}
            ariaLabel="Custom sprite demo"
            items={[
              { label: 'Home', href: '/', spriteUrl: swatchSprite('#f43f5e') },
              { label: 'Work', href: '/work', spriteUrl: swatchSprite('#8b5cf6') },
              { label: 'Writing', href: '/writing', spriteUrl: swatchSprite('#0ea5e9') },
            ]}
            theme={{ accentColor, ringStyle: 'solid' }}
          />
        </section>
      </div>
    </main>
  );
}

/** Tiny inline SVG stand-in, so the custom-sprite demo needs no extra asset files. */
function swatchSprite(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3" fill="${color}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
