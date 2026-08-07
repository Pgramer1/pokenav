import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { isDevelopmentEnv } from '../src/warn.ts';

/*
 * `src/modules.d.ts` declares a deliberately minimal ambient `process` — one optional `env`
 * field, which is all the package itself is allowed to touch — and that declaration is in
 * scope here too. These tests spawn subprocesses and need the real thing, so the global is
 * re-typed once rather than working around the narrow shape at every call site.
 */
const node = process as unknown as NodeJS.Process;

/*
 * The rule: warnings are opt-in. Only an environment that positively reports a non-production
 * NODE_ENV gets them. Anything undetermined is treated as production, because the
 * environments where `process` is missing — a browser loading the ESM build from a CDN, an
 * edge runtime, a worker — are real users, not developers.
 */
test('only an explicit non-production NODE_ENV counts as development', () => {
  assert.equal(isDevelopmentEnv('development'), true);
  assert.equal(isDevelopmentEnv('test'), true);
  assert.equal(isDevelopmentEnv('staging'), true);
  assert.equal(isDevelopmentEnv('production'), false);
  // The case that used to fall through to "development" and ship warnings to users.
  assert.equal(isDevelopmentEnv(undefined), false);
});

// Kept as `file://` URLs: a bare Windows path is not a valid ESM specifier.
const WARN_SRC = new URL('../src/warn.ts', import.meta.url).href;
const DIST = new URL('../dist/index.js', import.meta.url).href;

/**
 * Runs `warnOnce` in a fresh process and reports whether it wrote anything.
 *
 * A subprocess rather than a mock, because the gate is a module-scope constant captured at
 * import time — the only honest way to vary it is a fresh import under a fresh environment.
 *
 * `warn.ts` is imported on its own rather than through the component: it has no imports of
 * its own, so it is the one part of the package that can still be loaded with `process`
 * deleted. React cannot — `react-dom/server` reads `process.env.NODE_ENV` at module scope
 * and throws — which is a fact about React's packaging, not about this gate.
 */
function warnsWith(overrides: Record<string, string | undefined>, deleteProcess = false): boolean {
  const script = `
    const out = process.stdout;
    ${deleteProcess ? 'delete globalThis.process;' : ''}
    let warned = false;
    console.warn = () => { warned = true; };
    const { warnOnce } = await import(${JSON.stringify(WARN_SRC)});
    warnOnce('probe');
    out.write(warned ? 'WARNED' : 'SILENT');
  `;

  const result = execFileSync(node.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: { ...node.env, NODE_ENV: undefined, ...overrides },
  });
  assert.match(result, /^(WARNED|SILENT)$/, `unexpected probe output: ${result}`);
  return result === 'WARNED';
}

test('NODE_ENV=development warns', () => {
  assert.equal(warnsWith({ NODE_ENV: 'development' }), true);
});

test('NODE_ENV=production stays silent', () => {
  assert.equal(warnsWith({ NODE_ENV: 'production' }), false);
});

test('an unset NODE_ENV stays silent', () => {
  assert.equal(warnsWith({}), false);
});

test('a missing `process` stays silent and does not throw', () => {
  // The regression: `typeof process !== 'undefined' && ... === 'production'` was false here,
  // which read as "not production" and shipped warnings to real users.
  assert.equal(warnsWith({ NODE_ENV: 'development' }, true), false);
});

/**
 * End-to-end through the built component, so the gate is verified where it is actually
 * used rather than only in isolation.
 */
function renderWarnings(nodeEnv: string): string {
  const script = `
    const lines = [];
    console.warn = (...a) => lines.push(a.join(' '));
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { Pokenav } = await import(${JSON.stringify(DIST)});
    renderToStaticMarkup(createElement(Pokenav, {
      position: 'left',
      orientation: 'vertical',
      items: [{ label: 'Broken', href: '/broken' }],
    }));
    process.stdout.write(lines.join('\\n'));
  `;
  return execFileSync(node.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: { ...node.env, NODE_ENV: nodeEnv },
  });
}

test('the built component warns in development about an unresolvable sprite', () => {
  const output = renderWarnings('development');
  assert.match(output, /\[pokenav\]/);
  assert.match(output, /neither spriteUrl nor pokemonId/);
});

test('the built component is silent in production', () => {
  assert.equal(renderWarnings('production').trim(), '');
});
