/**
 * Normalizes the many shapes an image can arrive in into a plain URL string.
 *
 * Bundlers disagree about what importing an image yields, so normalize rather than assume.
 * Webpack's asset modules, Vite and Rollup all hand back a plain URL string. Next.js runs
 * images through its own loader and hands back a `StaticImageData` object — `{ src, width,
 * height, blurDataURL }` — so a string check alone silently treats every sprite in a Next
 * app as missing.
 *
 * This is shared by both sprite paths on purpose. `spriteUrl` needs exactly the same
 * treatment as the catalogue's dynamic `import()`: a consumer writing
 * `import icon from './icon.png'` has no idea whether their bundler produced a string or an
 * object, and passing the object straight through renders `src="[object Object]"`. The two
 * paths differing here is what made the same bug appear twice.
 *
 * The four shapes handled, in order: a bare string, `{ src }` (an unwrapped
 * `StaticImageData`), `{ default: string }` (a namespace object from a bundler that keeps
 * the default export), and `{ default: { src } }` (Next's namespace object).
 */
export function toUrl(value: unknown): string | undefined {
  if (typeof value === 'string') return value || undefined;
  if (typeof value !== 'object' || value === null) return undefined;

  const record = value as Record<string, unknown>;
  // `src` first: a Next module has both `default` and, once unwrapped, a `src`.
  if (typeof record.src === 'string') return record.src || undefined;
  if (typeof record.default === 'string') return record.default || undefined;
  if (typeof record.default === 'object' && record.default !== null) {
    const inner = (record.default as Record<string, unknown>).src;
    if (typeof inner === 'string') return inner || undefined;
  }
  return undefined;
}
