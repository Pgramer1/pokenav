import type { Metadata } from 'next';
import 'pokenav/styles.css';
import './globals.css';
import { SiteNav } from './SiteNav';
import { Footer } from './Footer';

export const metadata: Metadata = {
  title: {
    default: 'pokenav — a Pokémon route-map nav component for React',
    template: '%s — pokenav',
  },
  description:
    'A Pokémon route-map style navigation component for React. A trail of circular nodes connected by a dotted line, each showing a pixel-art sprite for a page or section.',
};

/**
 * Applies the stored theme before first paint.
 *
 * The toggle writes `pokenav-theme`; replaying it here — rather than in an effect — is what
 * stops a stored light preference from flashing the dark default on every navigation. It has
 * to be inline and synchronous in <head> for that, so a deferred module would not do.
 */
const THEME_INIT = `try{var t=localStorage.getItem('pokenav-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script mutates <html> before React hydrates, which is exactly the mismatch
    // this suppresses. It is scoped to this element's own attributes, not the tree.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <a className="skipLink" href="#main">
          Skip to content
        </a>
        <SiteNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
