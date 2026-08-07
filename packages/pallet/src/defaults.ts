import { CSS_GEOMETRY } from './cssGeometry';
import type { NavGeometry, NavTheme, ResolvedNavTheme } from './types';

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
 *
 * `geometry` comes from `cssGeometry.ts`, which is generated from the stylesheet's own
 * declarations — the numbers are not written down twice.
 */
export const DEFAULT_THEME: ResolvedNavTheme = {
  accentColor: '#64748b',
  surfaceColor: 'Canvas',
  ringStyle: 'solid',
  trailPath: 'straight',
  dotStyle: 'dotted',
  font: 'inherit',
  geometry: { ...CSS_GEOMETRY },
};

export function resolveTheme(theme?: NavTheme): ResolvedNavTheme {
  const { geometry, ...rest } = theme ?? {};
  return {
    ...DEFAULT_THEME,
    ...stripUndefined(rest),
    geometry: { ...DEFAULT_THEME.geometry, ...stripUndefined(geometry) },
  };
}

/**
 * The geometry the consumer explicitly asked for, as CSS custom properties — and only
 * those.
 *
 * Emitting the resolved geometry instead would put an inline `--pallet-gap` on every nav,
 * and an inline declaration outranks any stylesheet rule. That would silently break the
 * documented "override the custom properties in your CSS" path for everybody, in order to
 * serve the few who set `theme.geometry`. So unset fields emit nothing and the stylesheet
 * keeps its say.
 */
export function geometryCustomProperties(
  geometry: NavGeometry | undefined,
): Record<string, string> {
  const style: Record<string, string> = {};
  if (!geometry) return style;
  if (geometry.nodeSize !== undefined) style['--pallet-node-size'] = `${geometry.nodeSize}px`;
  if (geometry.gap !== undefined) style['--pallet-gap'] = `${geometry.gap}px`;
  if (geometry.waveAmplitude !== undefined) {
    style['--pallet-wave-amplitude'] = `${geometry.waveAmplitude}px`;
  }
  return style;
}

function stripUndefined<T extends object>(value: T | undefined): Partial<T> {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
