'use client';

import { usePathname } from 'next/navigation';
import { Pallet, type NavConfig } from '@devanshsoni/pallet';

/**
 * Placeholder demo. Its only job right now is to prove the workspace wiring: the docs app
 * imports the built `pallet` package, passes a real `NavConfig` through, and renders.
 *
 * The sprite picker and live demo (PALLET-PLAN.md §7) replace this later.
 */
const demoConfig: NavConfig = {
  position: 'left',
  orientation: 'vertical',
  items: [
    { label: 'Home', href: '/', pokemonId: 133 },
    { label: 'Work', href: '/work', pokemonId: 81 },
    { label: 'Writing', href: '/writing', pokemonId: 137 },
    { label: 'Contact', href: '/contact', pokemonId: 185 },
  ],
  theme: {
    accentColor: '#f97316',
    dotStyle: 'dotted',
  },
};

export default function Home() {
  const pathname = usePathname();

  return (
    <main>
      <h1>pallet</h1>
      <p>
        A Pokémon route-map style navigation component for React. This docs site is a
        placeholder — the sprite picker and live demo land in a later phase.
      </p>

      <h2>Workspace check</h2>
      <p>
        The nav below is rendered by the <code>@devanshsoni/pallet</code> package, resolved
        through npm workspaces from <code>packages/pallet/dist</code>. Sprites come from the
        bundled catalogue as inlined <code>data:</code> URIs — no network request, no
        bundler configuration.
      </p>

      <Pallet {...demoConfig} activeHref={pathname} ariaLabel="Demo navigation" />
    </main>
  );
}
