import type { NavTheme, ResolvedNavTheme } from './types';

/**
 * Fallbacks for every themeable value.
 *
 * `accentColor` is a neutral slate on purpose — the component should look deliberate out
 * of the box without claiming a brand color. Consumers override it and everything else
 * (active ring, hover ring, trail) follows.
 */
export const DEFAULT_THEME: ResolvedNavTheme = {
  accentColor: '#64748b',
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
