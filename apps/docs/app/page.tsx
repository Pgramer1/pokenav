'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pokenav, useScrollProgress, type NavConfig } from 'pokenav/pokemon';
import { Picker } from './Picker';
import { CopyButton } from './CopyButton';

/**
 * Live demo for the bundled sprites.
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

/** Pokéball red — the hero keeps its own accent so it never depends on the controls below. */
const HERO_ACCENT = '#e3350d';

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
    <main id="main">
      <header className="hero">
        <div className="heroCopy">
          <span className="eyebrow">React component · zero runtime deps</span>
          <h1 className="heroTitle">pokenav</h1>
          <p className="heroLede">
            A Pokémon route-map style navigation for React — a trail of circular nodes joined
            by a dotted line, each showing a pixel-art sprite for a page or section.
          </p>

          <div className="installBar">
            <code className="installCmd">
              <span className="installPrompt" aria-hidden="true">
                $
              </span>
              npm install pokenav
            </code>
            <CopyButton value="npm install pokenav" className="copy installCopy" />
          </div>

          <div className="heroActions">
            <Link className="btn btnPrimary" href="/usage">
              Read the docs
            </Link>
            <a className="btn" href="#build">
              Build a nav
            </a>
          </div>

          <ul className="heroFacts">
            <li>898 sprites, loaded lazily</li>
            <li>Plain CSS — no Tailwind, no framework coupling</li>
            <li>Bring your own artwork with <code>spriteUrl</code></li>
          </ul>
        </div>

        <div className="heroStage" onClick={capture}>
          <Pokenav
            position="left"
            orientation="vertical"
            items={items}
            activeHref={activeHref}
            ariaLabel="Example navigation"
            theme={{ accentColor: HERO_ACCENT, trailPath: 'wavy', dotStyle: 'dotted' }}
          />
          <span className="stageHint">Click a node</span>
        </div>
      </header>

      <div id="build" className="anchorTarget" />
      <Picker />

      <section className="block" aria-labelledby="variants">
        <div className="blockHead">
          <span className="eyebrow">Theming</span>
          <h2 id="variants">One accent, every variant</h2>
          <p className="hint">
            Everything below is the same component under different theme settings — ring,
            trail, hover, focus and fill colors all derive from a single <code>accentColor</code>.
            Click a node to change the active route.
          </p>
        </div>

        <div className="controls">
          <span className="controlsLabel" id="accent-label">
            accentColor
          </span>
          <span className="swatches" role="group" aria-labelledby="accent-label">
            {ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                className="swatch"
                data-selected={color === accentColor ? '' : undefined}
                aria-pressed={color === accentColor}
                style={{ background: color }}
                onClick={() => setAccentColor(color)}
                aria-label={`Use accent ${color}`}
              />
            ))}
          </span>
        </div>

        <h3 className="subhead" id="trail-path">
          Trail path
        </h3>
        <div className="demos" onClick={capture}>
          <Demo tags={['straight']}>
            <Pokenav
              position="left"
              orientation="vertical"
              items={items}
              activeHref={activeHref}
              ariaLabel="Straight trail demo"
              theme={{ accentColor, trailPath: 'straight', dotStyle: 'dotted' }}
            />
          </Demo>

          <Demo tags={['wavy']}>
            <Pokenav
              position="left"
              orientation="vertical"
              items={items}
              activeHref={activeHref}
              ariaLabel="Wavy trail demo"
              theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
            />
          </Demo>

          <Demo tags={['wavy', 'pokeball']}>
            <Pokenav
              position="left"
              orientation="vertical"
              items={items}
              activeHref={activeHref}
              ariaLabel="Wavy pokeball demo"
              theme={{ accentColor, trailPath: 'wavy', ringStyle: 'pokeball', dotStyle: 'dashed' }}
            />
          </Demo>

        </div>

        <h3 className="subhead" id="horizontal">
          Horizontal orientation
        </h3>
        <p className="hint">
          Labels sit below the node so the trail never runs through them. <code>position</code>{' '}
          stays independent — it controls which end the trail packs to.
        </p>
        <div className="demosStacked" onClick={capture}>
          <Demo tags={['horizontal', 'straight']}>
            <Pokenav
              position="left"
              orientation="horizontal"
              items={items}
              activeHref={activeHref}
              ariaLabel="Horizontal straight demo"
              theme={{ accentColor, trailPath: 'straight', dotStyle: 'dotted' }}
            />
          </Demo>

          <Demo tags={['horizontal', 'wavy']}>
            <Pokenav
              position="left"
              orientation="horizontal"
              items={items}
              activeHref={activeHref}
              ariaLabel="Horizontal wavy demo"
              theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
            />
          </Demo>

          <Demo tags={['horizontal', 'pokeball', 'position: right']}>
            <Pokenav
              position="right"
              orientation="horizontal"
              items={items}
              activeHref={activeHref}
              ariaLabel="Horizontal pokeball right demo"
              theme={{ accentColor, trailPath: 'wavy', ringStyle: 'pokeball', dotStyle: 'dashed' }}
            />
          </Demo>
        </div>
      </section>

      <section className="block" aria-labelledby="scroll-fill">
        <div className="blockHead">
          <span className="eyebrow">Scroll linking</span>
          <h2 id="scroll-fill">Scroll-linked trail fill</h2>
          <p className="hint">
            Scroll the page — the trail fills continuously in <code>accentColor</code>, and the
            highlight travels to whichever node the fill has reached. Progress comes from{' '}
            <code>useScrollProgress()</code>, not from inside the component.
          </p>
        </div>

        <div className="meter" role="img" aria-label={`Scroll progress ${Math.round(scrollProgress * 100)} percent`}>
          <div className="meterTrack">
            <div className="meterFill" style={{ width: `${scrollProgress * 100}%` }} />
          </div>
          <code className="meterValue">{scrollProgress.toFixed(2)}</code>
        </div>

        <div className="demos" onClick={capture}>
          <Demo tags={['straight']}>
            <Pokenav
              position="left"
              orientation="vertical"
              items={items}
              activeHref={activeHref}
              scrollProgress={scrollProgress}
              ariaLabel="Scroll fill straight demo"
              theme={{ accentColor, trailPath: 'straight', dotStyle: 'dotted' }}
            />
          </Demo>

          <Demo tags={['wavy']}>
            <Pokenav
              position="left"
              orientation="vertical"
              items={items}
              activeHref={activeHref}
              scrollProgress={scrollProgress}
              ariaLabel="Scroll fill wavy demo"
              theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
            />
          </Demo>
        </div>

        {/* Full width, not a third of the row: a horizontal trail is wider than a card in a
            three-across grid, and squeezing it there puts the last node under the scroll
            edge where its highlight ring gets clipped. */}
        <div className="demosStacked" onClick={capture}>
          <Demo tags={['horizontal', 'wavy']}>
            <Pokenav
              position="left"
              orientation="horizontal"
              items={items}
              activeHref={activeHref}
              scrollProgress={scrollProgress}
              ariaLabel="Scroll fill horizontal demo"
              theme={{ accentColor, trailPath: 'wavy', dotStyle: 'dotted' }}
            />
          </Demo>
        </div>
      </section>

      <section className="block" aria-labelledby="custom-sprites">
        <div className="blockHead">
          <span className="eyebrow">Not just Pokémon</span>
          <h2 id="custom-sprites">Custom sprites</h2>
          <p className="hint">
            Every item takes a <code>spriteUrl</code>, so the component works with entirely your
            own artwork and never touches the bundled catalogue — which is also the answer to
            the sprite licensing question.
          </p>
        </div>
        <div className="demos" onClick={capture}>
          <Demo tags={['spriteUrl']}>
            <Pokenav
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
          </Demo>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to drop it in?</h2>
        <p className="hint">
          The usage docs cover install, the full <code>NavConfig</code> reference, custom
          sprites and accessibility.
        </p>
        <Link className="btn btnPrimary" href="/usage">
          Read the docs
        </Link>
      </section>

    </main>
  );
}

function Demo({ tags, children }: { tags: string[]; children: React.ReactNode }) {
  return (
    <section className="demo">
      <h4 className="demoHead">
        {tags.map((tag) => (
          <code key={tag}>{tag}</code>
        ))}
      </h4>
      <div className="demoStage">{children}</div>
    </section>
  );
}

/** Tiny inline SVG stand-in, so the custom-sprite demo needs no extra asset files. */
function swatchSprite(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3" fill="${color}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
