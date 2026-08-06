import type { NavTheme, ResolvedNavTheme } from './types';

/**
 * Fallbacks for every themeable value.
 *
 * `accentColor` is a neutral slate on purpose — the component should look deliberate out
 * of the box without claiming a brand color. Consumers override it and everything else
 * (active ring, hover ring, trail) follows.
 *
 * `surfaceColor` defaults to the `Canvas` system color rather than a literal, because it
 * describes the consumer's background and a literal would be wrong for half of them. As a
 * system color it already tracks the page's `color-scheme`, so a site that declares
 * `color-scheme: dark` gets a dark surface without configuring anything.
 */
export const DEFAULT_THEME: ResolvedNavTheme = {
  accentColor: '#64748b',
  surfaceColor: 'Canvas',
  ringStyle: 'solid',
  trailPath: 'straight',
  dotStyle: 'dotted',
  font: 'inherit',
};

export function resolveTheme(theme?: NavTheme): ResolvedNavTheme {
  return { ...DEFAULT_THEME, ...stripUndefined(theme) };
}

function stripUndefined<T extends object>(value: T | undefined): Partial<T> {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
