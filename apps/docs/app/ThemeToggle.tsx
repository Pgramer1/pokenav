'use client';

import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark';

/**
 * Light/dark switch for the docs chrome.
 *
 * The site follows `prefers-color-scheme` until the visitor overrides it, at which point the
 * choice is stored and replayed by the inline script in `layout.tsx` before first paint.
 * Worth having on this site in particular: the component's whole pitch is that every color
 * derives from one accent, and a reader can only check that claim in both schemes if they
 * can switch without touching their OS settings.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);

  // Read on the client only — the server has no way to know which scheme applies, and
  // guessing would render the wrong icon and then swap it after hydration.
  useEffect(() => {
    const stored = window.localStorage.getItem('pokenav-theme');
    if (stored === 'light' || stored === 'dark') {
      setMode(stored);
      return;
    }
    setMode(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem('pokenav-theme', next);
    } catch {
      // Private-mode storage refusal shouldn't cost the visitor the toggle itself — the
      // theme still applies for this page view, it just won't survive a reload.
    }
  };

  // Same box before and after mount, so resolving the mode never reflows the header.
  if (mode === null) return <span className="themeToggle" aria-hidden="true" />;

  const target = mode === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="themeToggle"
      onClick={toggle}
      aria-label={`Switch to ${target} theme`}
      title={`Switch to ${target} theme`}
    >
      {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 1.8v2M10 16.2v2M18.2 10h-2M3.8 10h-2M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4M15.8 15.8l-1.4-1.4M5.6 5.6 4.2 4.2" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M17 12.3A7.5 7.5 0 0 1 7.7 3a7.5 7.5 0 1 0 9.3 9.3Z" strokeLinejoin="round" />
    </svg>
  );
}
