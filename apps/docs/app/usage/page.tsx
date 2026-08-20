'use client';

import Link from 'next/link';
import type { NavConfig } from 'pokenav';
import { CodeExample } from '../CodeExample';
import { CopyButton } from '../CopyButton';
import { Toc } from './Toc';

/**
 * Usage documentation. Every example on this page is a real NavConfig object that is both
 * rendered as a live component and serialized into the code block beside it, so the two
 * can never disagree.
 */

const MINIMAL: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', spriteUrl: '/icons/star.svg' },
    { label: 'Work', href: '/work', spriteUrl: '/icons/leaf.svg' },
    { label: 'Contact', href: '/contact', spriteUrl: '/icons/bolt.svg' },
  ],
};

const POKEMON: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', pokemonId: 133 },
    { label: 'Work', href: '/work', pokemonId: 81 },
    { label: 'Contact', href: '/contact', pokemonId: 185 },
  ],
  theme: { accentColor: '#8b5cf6' },
};

const CENTERED: NavConfig = {
  position: 'center',
  orientation: 'horizontal',
  items: [
    { label: 'Home', href: '/', pokemonId: 25 },
    { label: 'Work', href: '/work', pokemonId: 133 },
    { label: 'Writing', href: '/writing', pokemonId: 143 },
    { label: 'Contact', href: '/contact', pokemonId: 448 },
  ],
  theme: { accentColor: '#16a34a', trailPath: 'wavy' },
};

export default function Usage() {
  return (
    <div className="docsLayout">
      <main id="main" className="prose">
        <header className="docsHead">
          <span className="eyebrow">Documentation</span>
          <h1>Usage</h1>
          <p className="lede">
            Everything you need to drop <code>pokenav</code> into a React app. Prefer picking
            sprites visually? Use the <Link href="/">playground</Link> and copy the config it
            generates.
          </p>
        </header>

        <H2 id="install">Install</H2>
        <Command value="npm install pokenav" />
        <p>
          <code>react</code> and <code>react-dom</code> (&gt;=18) are peer dependencies. Import
          the stylesheet once, anywhere in your app — in the Next.js App Router, your root
          layout:
        </p>
        <Command value="import 'pokenav/styles.css';" prompt={false} />

        <H2 id="minimal">Minimal example</H2>
        <p>
          The smallest config that renders: a position, an orientation, and some items. Every
          other field has a default.
        </p>
        <CodeExample config={MINIMAL} showImports caption="Minimal example" />
        <p className="note">
          <code>activeHref</code> is a plain string you supply — the component compares it to
          each item&apos;s <code>href</code> and imports no router. Use{' '}
          <code>usePathname()</code> in the App Router, <code>useRouter().pathname</code> in
          Pages, <code>useLocation().pathname</code> in React Router, or your own scroll-spy.
        </p>

        <H2 id="scroll-spy">Wiring up scroll-based active state</H2>
        <p>
          On a one-page site the nav items are <code>#anchor</code>s rather than routes, and
          both <code>activeHref</code> and <code>scrollProgress</code> come from the scroll
          position. The component computes neither itself — it takes them as props, because
          scroll-spy is app-specific: your sticky header, section heights, and layout vary.
          What follows is a reference to <em>adapt</em>, not something to import.
        </p>
        <Snippet
          lang="tsx"
          value={`'use client';

import { useEffect, useState } from 'react';

const HEADER_HEIGHT = 80; // your sticky header's height, in px

/**
 * Reference scroll-spy for a one-page anchor nav. Copy this into your own
 * project and adapt it — it is example code, not an import from 'pokenav'.
 *
 * The activation line is the vertical CENTER of the viewport, not the top
 * edge or a sticky header's bottom. With a top-of-viewport or header-bottom
 * line, a tall section (a full-viewport hero) stays "current" until it has
 * scrolled entirely off-screen, and the highlight lags one section behind
 * what the reader is actually looking at.
 */
export function useSectionTrail(ids: readonly string[]) {
  const [trail, setTrail] = useState(() => ({
    activeHref: ids[0] !== undefined ? \`#\${ids[0]}\` : undefined,
    scrollProgress: 0,
  }));

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      const line = HEADER_HEIGHT + window.innerHeight / 2;

      // Scroll offset at which each section crosses the line, read fresh every
      // frame — section tops move after images load or webfonts settle.
      const tops = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => el.getBoundingClientRect().top + window.scrollY - line);
      if (tops.length === 0) return;

      let index = 0;
      for (let i = 0; i < tops.length; i += 1) {
        if (tops[i] <= window.scrollY) index = i;
      }
      // A short final section (a footer) may never cross the center line;
      // bottoming out the page should still activate it.
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        index = tops.length - 1;
      }

      // Section-space progress: (index + fraction through this section) /
      // (sections - 1). Pokenav's highlight reads it back with
      // floor(progress * (sections - 1)), so this is the exact inverse and
      // the reached node is always the section you are in.
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const start = tops[index];
      const end = tops[index + 1] ?? Math.max(maxScroll, start);
      const extent = end - start;
      const fraction = extent > 0 ? clamp01((window.scrollY - start) / extent) : 0;
      const scrollProgress = (index + fraction) / (tops.length - 1);

      const activeHref = ids[index] !== undefined ? \`#\${ids[index]}\` : undefined;
      setTrail((prev) =>
        prev.activeHref === activeHref && prev.scrollProgress === scrollProgress
          ? prev
          : { activeHref, scrollProgress },
      );
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // ids is a fresh array each render; its joined value is the stable identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  return trail;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}`}
        />
        <p>
          Feed the two returned values straight into the component, one source for both — the
          highlight and <code>aria-current</code> then cannot disagree:
        </p>
        <Snippet
          lang="tsx"
          value={`const sections = ['intro', 'work', 'writing', 'contact'];

function Nav() {
  const trail = useSectionTrail(sections);

  return (
    <Pokenav
      position="left"
      orientation="vertical"
      items={sections.map((id) => ({
        href: \`#\${id}\`,
        label: labels[id],
        spriteUrl: icons[id],
      }))}
      activeHref={trail.activeHref}
      scrollProgress={trail.scrollProgress}
    />
  );
}`}
        />
        <p>
          The one thing to get right is the <strong>activation line</strong> — how far below
          the top of the viewport a section has to reach before it counts as current. A naive
          spy uses the top of the viewport or the bottom of a sticky header. With a tall
          section, such as a full-viewport hero, that line is too high: the hero stays
          highlighted until it has scrolled entirely off-screen, so the highlight lags one
          section behind what the reader is actually looking at. The fix is the vertical{' '}
          <em>center</em> of the viewport — the <code>HEADER_HEIGHT + viewport / 2</code> in
          the hook above — so a section lights up as soon as its top passes the middle of the
          screen. Set <code>scroll-padding-top</code> on <code>html</code> to the same line —
          <code>scroll-padding-top: calc(var(--header-height) + 50vh)</code> — and a clicked
          nav item lands its target there too.
        </p>
        <p className="note">
          <strong>Adapt this, don&apos;t import it.</strong> The hook is example code, and the
          header height, section ids, and scroll container are yours to own. The package does
          ship <code>useSectionProgress</code>, which returns both values as one reading — but
          its activation line defaults to <code>scroll-padding-top</code>, the header-bottom
          line that exhibits the lag above. If you want the center line, adapt this hook.
        </p>

        <H2 id="entry-points">Two entry points</H2>
        <p>
          <code>pokenav</code> resolves <code>spriteUrl</code>. <code>pokenav/pokemon</code>{' '}
          resolves <code>spriteUrl</code> <em>and</em> <code>pokemonId</code>. Same component,
          same props, same styling — the difference is what ends up in your build.
        </p>
        <div className="tableWrap">
          <table className="propTable">
            <thead>
              <tr>
                <th>Import</th>
                <th>Resolves</th>
                <th>Use when</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>pokenav</code>
                </td>
                <td>
                  <code>spriteUrl</code>
                </td>
                <td>
                  <strong>Default.</strong> Your own artwork, any image source. Renders sprites
                  in server HTML.
                </td>
              </tr>
              <tr>
                <td>
                  <code>pokenav/pokemon</code>
                </td>
                <td>
                  <code>spriteUrl</code> + <code>pokemonId</code>
                </td>
                <td>You want the bundled Pokémon catalogue.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Reach for <code>pokenav</code> unless you need <code>pokemonId</code>. The core entry
          ships no <code>catalogue.json</code> and no dynamic-import context over the 898
          bundled sprites, so your bundler emits nothing for them. Adding{' '}
          <code>pokenav/pokemon</code> brings a separately-loadable chunk per sprite, because
          the import context is built statically and your bundler cannot know which numeric ids
          a runtime config will pick. Those chunks are never <em>downloaded</em> unless a config
          names them, but they occupy build output, and no runtime flag removes them.
        </p>
        <CodeExample config={POKEMON} showImports caption="Pokémon sprite example" />
        <p className="note">
          Want a handful of the bundled sprites without the catalogue? Import them directly —{' '}
          <code>import eevee from &apos;pokenav/sprites/133.png&apos;</code> — and pass them as{' '}
          <code>spriteUrl</code>. That form is statically analyzable, so your bundler emits
          exactly the sprites you named, and it server-renders.
        </p>

        <H2 id="reference">NavConfig reference</H2>
        <div className="tableWrap">
          <table className="propTable">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>position</code>
                </td>
                <td>
                  <code>&apos;left&apos; | &apos;center&apos; | &apos;right&apos;</code>
                </td>
                <td>
                  <span className="required">required</span>
                </td>
                <td>
                  Which edge the trail anchors to. Also sets which side labels and the pokéball
                  button sit on; <code>center</code> follows <code>left</code> there.
                </td>
              </tr>
              <tr>
                <td>
                  <code>orientation</code>
                </td>
                <td>
                  <code>&apos;vertical&apos; | &apos;horizontal&apos;</code>
                </td>
                <td>
                  <span className="required">required</span>
                </td>
                <td>
                  Which axis the trail runs along. Independent of <code>position</code>.
                </td>
              </tr>
              <tr>
                <td>
                  <code>items</code>
                </td>
                <td>
                  <code>NavItem[]</code>
                </td>
                <td>
                  <span className="required">required</span>
                </td>
                <td>One node per item, in trail order.</td>
              </tr>
              <tr>
                <td>
                  <code>theme</code>
                </td>
                <td>
                  <code>NavTheme</code>
                </td>
                <td>
                  <code>{'{}'}</code>
                </td>
                <td>Optional styling. See below.</td>
              </tr>
              <tr>
                <td>
                  <code>matchActive</code>
                </td>
                <td>
                  <code>
                    &apos;exact&apos; | &apos;prefix&apos; | (item, active) =&gt; boolean
                  </code>
                </td>
                <td>
                  <code>exact</code>
                </td>
                <td>
                  How <code>activeHref</code> is compared to each item&apos;s <code>href</code>.
                  See below.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <H3>NavItem</H3>
        <div className="tableWrap">
          <table className="propTable">
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>label</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>Visible label, and the section half of the sprite&apos;s alt text.</td>
              </tr>
              <tr>
                <td>
                  <code>href</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  Link destination, and what <code>activeHref</code> is compared against.
                </td>
              </tr>
              <tr>
                <td>
                  <code>spriteUrl</code>
                </td>
                <td>
                  <code>string | {'{ src: string }'}</code>
                </td>
                <td>
                  Any custom image, or a static import — Next.js hands back{' '}
                  <code>StaticImageData</code> rather than a string, and both work. Wins over{' '}
                  <code>pokemonId</code> and skips the catalogue entirely.
                </td>
              </tr>
              <tr>
                <td>
                  <code>alt</code>
                </td>
                <td>
                  <code>string?</code>
                </td>
                <td>
                  Explicit accessible name for the sprite. Without it, the name depends on the
                  resolution path — <code>pokemonId</code> gives &quot;Eevee — Home&quot;,{' '}
                  <code>spriteUrl</code> gives &quot;Home&quot;. Set <code>&apos;&apos;</code> to
                  mark the sprite decorative and let the visible label carry the name.
                </td>
              </tr>
              <tr>
                <td>
                  <code>pokemonId</code>
                </td>
                <td>
                  <code>number?</code>
                </td>
                <td>
                  National Dex id, 1–898. Resolved from the bundled catalogue, loaded lazily.{' '}
                  <strong>
                    Requires the <code>pokenav/pokemon</code> entry point.
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <H3>NavTheme</H3>
        <div className="tableWrap">
          <table className="propTable">
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>accentColor</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>#64748b</code>
                </td>
                <td>
                  Single source of truth for the active ring, hover ring, inactive ring, trail
                  and focus ring. No color is hardcoded.
                </td>
              </tr>
              <tr>
                <td>
                  <code>surfaceColor</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>Canvas</code>
                </td>
                <td>
                  The background you paint behind the nav. Only <code>ringStyle: pokeball</code>{' '}
                  reads it — an inactive node recedes by mixing its halves toward this color
                  rather than dropping opacity, which is what stops a white half reading as a
                  glow on a dark surface. The default follows the page&apos;s{' '}
                  <code>color-scheme</code>.
                </td>
              </tr>
              <tr>
                <td>
                  <code>ringStyle</code>
                </td>
                <td>
                  <code>&apos;solid&apos; | &apos;pokeball&apos;</code>
                </td>
                <td>
                  <code>solid</code>
                </td>
                <td>
                  <code>pokeball</code> draws a red/white split ring with a button on the seam.
                </td>
              </tr>
              <tr>
                <td>
                  <code>trailPath</code>
                </td>
                <td>
                  <code>&apos;straight&apos; | &apos;wavy&apos;</code>
                </td>
                <td>
                  <code>straight</code>
                </td>
                <td>
                  <code>wavy</code> draws the trail as a curve through the node centers instead
                  of a straight line.
                </td>
              </tr>
              <tr>
                <td>
                  <code>dotStyle</code>
                </td>
                <td>
                  <code>&apos;dotted&apos; | &apos;dashed&apos; | &apos;solid&apos;</code>
                </td>
                <td>
                  <code>dotted</code>
                </td>
                <td>How the connecting trail is stroked.</td>
              </tr>
              <tr>
                <td>
                  <code>font</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>inherit</code>
                </td>
                <td>
                  CSS <code>font-family</code> applied to labels.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <H3>Component props beyond NavConfig</H3>
        <div className="tableWrap">
          <table className="propTable">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>activeHref</code>
                </td>
                <td>
                  <code>string?</code>
                </td>
                <td>Current route. Omit and no node is active.</td>
              </tr>
              <tr>
                <td>
                  <code>scrollProgress</code>
                </td>
                <td>
                  <code>number?</code>
                </td>
                <td>
                  0–1. Fills the trail and moves the highlight. <code>useScrollProgress()</code>{' '}
                  is exported for the page-scroll case.
                </td>
              </tr>
              <tr>
                <td>
                  <code>ariaLabel</code>
                </td>
                <td>
                  <code>string?</code>
                </td>
                <td>
                  Landmark name. Defaults to <code>&apos;Site navigation&apos;</code>.
                </td>
              </tr>
              <tr>
                <td>
                  <code>className</code>
                </td>
                <td>
                  <code>string?</code>
                </td>
                <td>
                  Merged onto the root <code>&lt;nav&gt;</code>.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2 id="centered">Centered horizontal nav</H2>
        <p>
          <code>position</code> and <code>orientation</code> are independent, so{' '}
          <code>center</code> works as a top nav. In horizontal, labels always sit below the
          node so the trail never runs through them.
        </p>
        <CodeExample config={CENTERED} caption="Centered horizontal example" />

        <H2 id="matching">Active route matching</H2>
        <p>
          By default <code>activeHref</code> must equal an item&apos;s <code>href</code>{' '}
          exactly. Set <code>matchActive=&quot;prefix&quot;</code> to keep a section&apos;s node
          lit on its sub-pages — <code>/blog</code> stays active on <code>/blog/some-post</code>.
        </p>
        <Command value={`<Pokenav {...config} activeHref={pathname} matchActive="prefix" />`} prompt={false} />
        <p className="note">
          Prefix matching handles the cases a bare <code>startsWith</code> gets wrong:{' '}
          <code>/</code> matches only <code>/</code> rather than lighting up on every page,{' '}
          <code>/blog</code> does not claim <code>/blogroll</code>, and trailing slashes, query
          strings and hashes are normalized away. For anything else — locale prefixes, hash
          routing — pass a function{' '}
          <code>(itemHref, activeHref) =&gt; boolean</code>.
        </p>

        <H2 id="fixed-rail">Fixed rail</H2>
        <p>
          The layout this component was built for: pinned to the side of the page, vertically
          centered in the space below a sticky header, hidden where there is no room for it.
        </p>
        <Snippet
          lang="tsx"
          value={`<div className="nav-rail">
  <Pokenav
    position="left"
    orientation="vertical"
    items={items}
    activeHref={usePathname()}
    matchActive="prefix"
  />
</div>`}
        />
        <Snippet
          lang="css"
          value={`.nav-rail {
  position: fixed;
  left: 2rem;
  /* Centered below the header, not in the viewport, so it never sits
     behind it. dvh so collapsing mobile browser chrome doesn't shift it. */
  top: calc(var(--header-height) + (100dvh - var(--header-height)) / 2);
  transform: translateY(-50%);
  z-index: 10;
}

@media (max-width: 900px) {
  /* display:none, not opacity/visibility — it must leave the tab order too. */
  .nav-rail { display: none; }
}`}
        />
        <p className="note">
          <strong>Tab order follows the DOM, not the screen.</strong> A fixed rail is usually
          mounted at the end of a layout with the other overlays, which puts it after the entire
          page in the tab sequence even though it reads as the first thing on screen. Render it
          before <code>&lt;main&gt;</code> in source order, or pair it with a skip link.
        </p>

        <H2 id="playground">Pick sprites visually</H2>
        <p>
          Writing Dex numbers by hand is no fun. The <Link href="/">playground</Link> lets you
          search all 898 sprites, filter by generation, assign them to nav items, and copy out
          the finished config.
        </p>

        <H2 id="accessibility">Accessibility</H2>
        <p>
          A <code>pokemonId</code> sprite carries alt text in the form{' '}
          <code>
            &quot;{'{Pokémon name}'} — {'{section name}'}&quot;
          </code>
          ; a <code>spriteUrl</code> sprite has no species name, so it carries the label alone.
          Set <code>alt</code> on an item to override both and get one consistent name whichever
          path it uses. Either way the visible label is hidden from assistive technology while a
          named sprite is present, so the section is not announced twice — set{' '}
          <code>alt=&quot;&quot;</code> to mark the sprite decorative and hand the name back to
          the label.
        </p>
        <p>
          Nodes are ordinary links, so keyboard navigation works by default, with a deliberate
          focus ring drawn in your accent color. All motion — hover bounce, ring transitions,
          trail fill — is suppressed under <code>prefers-reduced-motion</code>, while state that
          carries meaning, like the active node&apos;s scale and the scroll fill position, is
          kept. If you position the nav as a <Link href="#fixed-rail">fixed rail</Link>, check
          where it lands in the tab order.
        </p>

        <H2 id="licensing">Sprite licensing</H2>
        <p>
          The code is MIT. The bundled Pokémon sprites are fan-derived artwork,{' '}
          <strong>not</strong> covered by that license, and rely on the same fan-tolerance
          precedent as PokéAPI — a precedent, not a guarantee. Read{' '}
          <a
            href="https://github.com/Pgramer1/pokenav/blob/main/SPRITES-NOTICE.md"
            target="_blank"
            rel="noreferrer"
          >
            SPRITES-NOTICE.md
          </a>{' '}
          before shipping anything commercial, and remember that <code>spriteUrl</code> lets you
          avoid the question entirely.
        </p>
      </main>

      <Toc />
    </div>
  );
}

/** Section heading with a self-link, so any section can be linked to directly. */
function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="anchored">
      {children}
      <a href={`#${id}`} className="anchorLink" aria-label={`Link to this section`}>
        #
      </a>
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3>{children}</h3>;
}

/**
 * A multi-line snippet. `Command` is a single-line affordance — its text is `nowrap` and
 * scrolls sideways — so anything with newlines needs this instead.
 */
function Snippet({ lang, value }: { lang: string; value: string }) {
  return (
    <div className="exampleCode snippet">
      <div className="codeHead">
        <span className="codeLang">{lang}</span>
        <CopyButton value={value} className="copy copyInline" />
      </div>
      <pre className="code">
        <code>{value}</code>
      </pre>
    </div>
  );
}

/** A shell command or import line, with its own copy button. */
function Command({ value, prompt = true }: { value: string; prompt?: boolean }) {
  return (
    <div className="command">
      <code className="commandText">
        {prompt ? (
          <span className="installPrompt" aria-hidden="true">
            $
          </span>
        ) : null}
        {value}
      </code>
      <CopyButton value={value} className="copy copyInline" />
    </div>
  );
}
