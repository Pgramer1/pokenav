'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Playground' },
  { href: '/usage', label: 'Usage' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="siteHeader">
      <Link href="/" className="brand">
        {/*
         * Plain <img> rather than next/image: this is a fixed-size decorative mark, so the
         * optimizer buys nothing and would only add a request. Dimensions are set so it
         * reserves its space and cannot shift the header on load.
         */}
        <img src="/pokeball.png" alt="" width={22} height={22} className="brandMark" />
        pokenav
      </Link>
      <nav className="siteTabs" aria-label="Documentation sections">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="siteTab"
            data-current={pathname === tab.href ? '' : undefined}
            aria-current={pathname === tab.href ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <a
        className="siteTab siteTabExternal"
        href="https://github.com/Pgramer1/pokenav"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </a>
    </header>
  );
}
