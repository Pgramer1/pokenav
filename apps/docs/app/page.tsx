'use client';

import { useState } from 'react';
import { Pallet, useScrollProgress, type NavConfig } from '@devanshsoni/pallet';

/**
 * Live demo for the four bundled sprites.
 *
 * Note what is NOT here: no `usePathname`, no router import, and no internal scroll
 * listener inside the component. `activeHref` is ordinary state and `scrollProgress` comes
 * from a hook the consumer opts into — the component compares numbers and strings, and the
 * consumer decides where they come from.
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
  const scrollProgress = useScrollProgress();

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
        Click a node to change the active route. Every color comes from that one accent
        value — nothing is hardcoded.
      </p>

      <h2 className="section" id="trail-path">Trail path</h2>
      <div className="demos" onClick={capture}>
        <section className="demo">
          <h3>
            <code>straight</code>
          </h3>
          <Pallet
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Straight trail demo"
            theme={{ accentColor, trailPath: 'straight', dotStyle: 'dotted' }}
          />
        </section>

        <section className="demo">
          <h3>
            <code>wavy</code>
          </h3>
          <Pallet
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Wavy trail demo"
            theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
          />
        </section>

        <section className="demo">
          <h3>
            <code>wavy</code> + <code>pokeball</code>
          </h3>
          <Pallet
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Wavy pokeball demo"
            theme={{ accentColor, trailPath: 'wavy', ringStyle: 'pokeball', dotStyle: 'dashed' }}
          />
        </section>

        <section className="demo">
          <h3>
            <code>wavy</code> + <code>position: right</code>
          </h3>
          <Pallet
            position="right"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Wavy right demo"
            theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
          />
        </section>
      </div>

      <h2 className="section" id="horizontal">Horizontal orientation</h2>
      <p className="hint">
        Labels sit below the node so the trail never runs through them. <code>position</code>
        stays independent — it controls which end the trail packs to.
      </p>
      <div className="demosStacked" onClick={capture}>
        <section className="demo">
          <h3>
            <code>horizontal</code> + <code>straight</code>
          </h3>
          <Pallet
            position="left"
            orientation="horizontal"
            items={items}
            activeHref={activeHref}
            ariaLabel="Horizontal straight demo"
            theme={{ accentColor, trailPath: 'straight', dotStyle: 'dotted' }}
          />
        </section>

        <section className="demo">
          <h3>
            <code>horizontal</code> + <code>wavy</code>
          </h3>
          <Pallet
            position="left"
            orientation="horizontal"
            items={items}
            activeHref={activeHref}
            ariaLabel="Horizontal wavy demo"
            theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
          />
        </section>

        <section className="demo">
          <h3>
            <code>horizontal</code> + <code>pokeball</code> + <code>position: right</code>
          </h3>
          <Pallet
            position="right"
            orientation="horizontal"
            items={items}
            activeHref={activeHref}
            ariaLabel="Horizontal pokeball right demo"
            theme={{ accentColor, trailPath: 'wavy', ringStyle: 'pokeball', dotStyle: 'dashed' }}
          />
        </section>
      </div>

      <h2 className="section" id="scroll-fill">Scroll-linked trail fill</h2>
      <p className="hint">
        Scroll the page — the trail fills continuously in <code>accentColor</code>, and the
        highlight travels to whichever node the fill has reached. Progress is{' '}
        <code>{scrollProgress.toFixed(2)}</code>, supplied by <code>useScrollProgress()</code>
        , not read inside the component.
      </p>
      <div className="demos" onClick={capture}>
        <section className="demo">
          <h3>
            <code>straight</code>
          </h3>
          <Pallet
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            scrollProgress={scrollProgress}
            ariaLabel="Scroll fill straight demo"
            theme={{ accentColor, trailPath: 'straight', dotStyle: 'dotted' }}
          />
        </section>

        <section className="demo">
          <h3>
            <code>wavy</code>
          </h3>
          <Pallet
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            scrollProgress={scrollProgress}
            ariaLabel="Scroll fill wavy demo"
            theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
          />
        </section>

        <section className="demo">
          <h3>
            <code>horizontal</code> + <code>wavy</code>
          </h3>
          <Pallet
            position="left"
            orientation="horizontal"
            items={items}
            activeHref={activeHref}
            scrollProgress={scrollProgress}
            ariaLabel="Scroll fill horizontal demo"
            theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
          />
        </section>
      </div>

      <h2 className="section">Custom sprites, no Pokémon</h2>
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
            theme={{ accentColor, trailPath: 'wavy' }}
          />
        </section>
      </div>

      <div className="scrollRoom" aria-hidden="true" />
    </main>
  );
}

/** Tiny inline SVG stand-in, so the custom-sprite demo needs no extra asset files. */
function swatchSprite(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3" fill="${color}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
