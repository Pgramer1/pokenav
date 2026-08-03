'use client';

import Link from 'next/link';
import type { NavConfig } from '@devanshsoni/pallet';
import { CodeExample } from '../CodeExample';

/**
 * Usage documentation. Every example on this page is a real NavConfig object that is both
 * rendered as a live component and serialized into the code block beside it, so the two
 * can never disagree.
 */

const MINIMAL: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', pokemonId: 133 },
    { label: 'Work', href: '/work', pokemonId: 81 },
    { label: 'Contact', href: '/contact', pokemonId: 185 },
  ],
};

const CUSTOM_SPRITES: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', spriteUrl: '/icons/star.svg' },
    { label: 'Work', href: '/work', spriteUrl: '/icons/leaf.svg' },
    { label: 'Contact', href: '/contact', spriteUrl: '/icons/bolt.svg' },
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
    <main className="prose">
      <h1>Usage</h1>
      <p className="lede">
        Everything you need to drop <code>pallet</code> into a React app. Prefer picking
        sprites visually? Use the <Link href="/">playground</Link> and copy the config it
        generates.
      </p>

      <h2 id="install">Install</h2>
      <pre className="code">
        <code>npm install @devanshsoni/pallet</code>
      </pre>
      <p>
        <code>react</code> and <code>react-dom</code> (&gt;=18) are peer dependencies. Import
        the stylesheet once, anywhere in your app — in the Next.js App Router, your root
        layout:
      </p>
      <pre className="code">
        <code>{`import '@devanshsoni/pallet/styles.css';`}</code>
      </pre>

      <h2 id="minimal">Minimal example</h2>
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

      <h2 id="reference">NavConfig reference</h2>
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
            <td>—</td>
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
            <td>—</td>
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
            <td>—</td>
            <td>One node per item, in trail order.</td>
          </tr>
          <tr>
            <td>
              <code>theme</code>
            </td>
            <td>
              <code>NavTheme</code>
            </td>
            <td><code>{'{}'}</code></td>
            <td>Optional styling. See below.</td>
          </tr>
        </tbody>
      </table>

      <h3>NavItem</h3>
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
              <code>pokemonId</code>
            </td>
            <td>
              <code>number?</code>
            </td>
            <td>National Dex id, 1–898. Resolved from the bundled catalogue, loaded lazily.</td>
          </tr>
          <tr>
            <td>
              <code>spriteUrl</code>
            </td>
            <td>
              <code>string?</code>
            </td>
            <td>
              Any custom image. Wins over <code>pokemonId</code> and skips the catalogue
              entirely.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>NavTheme</h3>
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

      <h3>Component props beyond NavConfig</h3>
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

      <h2 id="centered">Centered horizontal nav</h2>
      <p>
        <code>position</code> and <code>orientation</code> are independent, so{' '}
        <code>center</code> works as a top nav. In horizontal, labels always sit below the
        node so the trail never runs through them.
      </p>
      <CodeExample config={CENTERED} caption="Centered horizontal example" />

      <h2 id="custom-sprites">Custom sprites — no Pokémon required</h2>
      <p>
        Set <code>spriteUrl</code> on an item and the bundled catalogue is never touched. Use
        it on every item and you get the route-map navigation with entirely your own art,
        and none of the licensing question below applies to your build.
      </p>
      <CodeExample config={CUSTOM_SPRITES} caption="Custom sprite example" />

      <h2 id="playground">Pick sprites visually</h2>
      <p>
        Writing Dex numbers by hand is no fun. The{' '}
        <Link href="/">playground</Link> lets you search all 898 sprites, filter by
        generation, assign them to nav items, and copy out the finished config.
      </p>

      <h2 id="accessibility">Accessibility</h2>
      <p>
        Sprites carry alt text in the form{' '}
        <code>&quot;{'{Pokémon name}'} — {'{section name}'}&quot;</code>, and the visible
        label is hidden from assistive technology when a sprite is present so the section
        is not announced twice. Nodes are ordinary links, so keyboard navigation works by
        default, with a deliberate focus ring drawn in your accent color. All motion —
        hover bounce, ring transitions, trail fill — is suppressed under{' '}
        <code>prefers-reduced-motion</code>, while state that carries meaning, like the
        active node&apos;s scale and the scroll fill position, is kept.
      </p>

      <h2 id="licensing">Sprite licensing</h2>
      <p>
        The code is MIT. The bundled Pokémon sprites are fan-derived artwork,{' '}
        <strong>not</strong> covered by that license, and rely on the same fan-tolerance
        precedent as PokéAPI — a precedent, not a guarantee. Read{' '}
        <a
          href="https://github.com/Pgramer1/Pallet/blob/main/SPRITES-NOTICE.md"
          target="_blank"
          rel="noreferrer"
        >
          SPRITES-NOTICE.md
        </a>{' '}
        before shipping anything commercial, and remember that <code>spriteUrl</code> lets
        you avoid the question entirely.
      </p>
    </main>
  );
}
