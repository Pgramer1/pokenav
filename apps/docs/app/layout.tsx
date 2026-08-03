import type { Metadata } from 'next';
import 'pokenav/styles.css';
import './globals.css';
import { SiteNav } from './SiteNav';

export const metadata: Metadata = {
  title: 'pokenav — docs',
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
