import type { Metadata } from 'next';
import '@devanshsoni/pallet/styles.css';
import './globals.css';
import { SiteNav } from './SiteNav';

export const metadata: Metadata = {
  title: 'pallet — docs',
  description: 'A Pokémon route-map style navigation component for React.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
