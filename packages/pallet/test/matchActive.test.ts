import test from 'node:test';
import assert from 'node:assert/strict';
import { ariaCurrentToken, isFragmentOnly, isItemActive } from '../src/matchActive.ts';

const prefix = (item: string, active: string) => isItemActive(item, active, 'prefix');
const exact = (item: string, active: string) => isItemActive(item, active, 'exact');

test('exact matching is plain string equality', () => {
  assert.equal(exact('/blog', '/blog'), true);
  assert.equal(exact('/blog', '/blog/post'), false);
  assert.equal(exact('/blog', '/blog/'), false);
  assert.equal(exact('#work', '#work'), true);
  assert.equal(exact('#work', '#writing'), false);
});

test('undefined activeHref never matches, whatever the strategy', () => {
  assert.equal(isItemActive('/blog', undefined, 'exact'), false);
  assert.equal(isItemActive('/blog', undefined, 'prefix'), false);
  assert.equal(isItemActive('/blog', undefined, () => true), false);
});

test('a matcher function takes over completely', () => {
  assert.equal(
    isItemActive('/blog', '/en/blog', (item, active) => active === `/en${item}`),
    true,
  );
  // Even where prefix logic would have said no.
  assert.equal(isItemActive('/blog', '/blogroll', () => true), true);
});

/*
 * The regression this file exists for. Every fragment-only href reduces to the same empty
 * path, so path-based prefix logic made them all equivalent: a section nav lit up
 * completely and stayed that way.
 */
test('prefix: fragment-only hrefs match only themselves', () => {
  const sections = ['#home', '#work', '#writing'];

  for (const active of sections) {
    const matched = sections.filter((item) => prefix(item, active));
    assert.deepEqual(matched, [active], `activeHref ${active} should match only itself`);
  }
});

test('prefix: fragment-only hrefs do not cross-match paths', () => {
  assert.equal(prefix('#work', '/work'), false);
  assert.equal(prefix('/work', '#work'), false);
  assert.equal(prefix('#work', '/page#work'), false);
  assert.equal(prefix('/page', '#work'), false);
});

test('prefix: query-only hrefs match only themselves', () => {
  // Same failure mode as fragments — no path to nest under, all reduce to ''.
  assert.equal(prefix('?page=2', '?page=3'), false);
  assert.equal(prefix('?page=2', '?page=2'), true);
});

test('prefix: an empty href does not match everything', () => {
  assert.equal(prefix('', '/blog'), false);
  assert.equal(prefix('', ''), true);
});

test('prefix: root matches only the root route', () => {
  assert.equal(prefix('/', '/'), true);
  assert.equal(prefix('/', '/blog'), false);
  assert.equal(prefix('/', '/blog/post'), false);
  // Decoration on the root route is still the root route.
  assert.equal(prefix('/', '/?page=2'), true);
  assert.equal(prefix('/', '/#top'), true);
});

test('prefix: nested routes match, sibling spellings do not', () => {
  assert.equal(prefix('/blog', '/blog'), true);
  assert.equal(prefix('/blog', '/blog/post'), true);
  assert.equal(prefix('/blog', '/blog/2024/post'), true);
  assert.equal(prefix('/blog', '/blogroll'), false);
  assert.equal(prefix('/blog', '/blogroll/x'), false);
  assert.equal(prefix('/blog', '/web'), false);
});

test('prefix: trailing slashes, queries and hashes normalize away', () => {
  assert.equal(prefix('/blog/', '/blog'), true);
  assert.equal(prefix('/blog', '/blog/'), true);
  assert.equal(prefix('/blog/', '/blog/post'), true);
  assert.equal(prefix('/blog', '/blog?page=2'), true);
  assert.equal(prefix('/blog', '/blog#top'), true);
  assert.equal(prefix('/blog', '/blog/post?page=2#comments'), true);
  // and the sibling still does not match once decorated
  assert.equal(prefix('/blog', '/blogroll?page=2'), false);
});

test('isFragmentOnly distinguishes in-page anchors from routes', () => {
  assert.equal(isFragmentOnly('#work'), true);
  assert.equal(isFragmentOnly('#'), true);
  assert.equal(isFragmentOnly('/work'), false);
  assert.equal(isFragmentOnly('/work#intro'), false);
  assert.equal(isFragmentOnly(''), false);
});

test('ariaCurrentToken follows the href', () => {
  assert.equal(ariaCurrentToken('#work'), 'location');
  assert.equal(ariaCurrentToken('/work'), 'page');
  assert.equal(ariaCurrentToken('/work#intro'), 'page');
  assert.equal(ariaCurrentToken('/'), 'page');
});
