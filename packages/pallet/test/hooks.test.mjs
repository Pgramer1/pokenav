import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.test/',
});

Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  Event: { value: dom.window.Event, configurable: true },
  MutationObserver: { value: dom.window.MutationObserver, configurable: true },
  getComputedStyle: {
    value: dom.window.getComputedStyle.bind(dom.window),
    configurable: true,
  },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true },
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = TestResizeObserver;

let nextFrame = 1;
const frames = new Map();
dom.window.requestAnimationFrame = (callback) => {
  const id = nextFrame;
  nextFrame += 1;
  frames.set(id, callback);
  return id;
};
dom.window.cancelAnimationFrame = (id) => {
  frames.delete(id);
};

const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { Pokenav, useScrollProgress, useSectionProgress } = await import('../dist/index.js');
const { act, createElement: h } = React;

after(() => {
  frames.clear();
  dom.window.close();
});

function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(0);
}

function defineScrollMetrics(element, { scrollHeight, clientHeight, scrollTop = 0 }) {
  Object.defineProperties(element, {
    scrollHeight: { value: scrollHeight, configurable: true },
    clientHeight: { value: clientHeight, configurable: true },
    scrollTop: { value: scrollTop, configurable: true, writable: true },
  });
}

function listenerCounts(element, type) {
  let added = 0;
  let removed = 0;
  const add = element.addEventListener.bind(element);
  const remove = element.removeEventListener.bind(element);

  element.addEventListener = (eventType, listener, options) => {
    if (eventType === type) added += 1;
    return add(eventType, listener, options);
  };
  element.removeEventListener = (eventType, listener, options) => {
    if (eventType === type) removed += 1;
    return remove(eventType, listener, options);
  };

  return {
    added: () => added,
    removed: () => removed,
  };
}

async function mount(element) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(element));
  return {
    container,
    root,
    async unmount() {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

function ScrollProbe({ target, revision = 0 }) {
  const progress = useScrollProgress(target);
  return h('output', { 'data-revision': revision }, String(progress));
}

test('useScrollProgress clamps element scroll and cleans up its listeners', async () => {
  const scroller = document.createElement('div');
  defineScrollMetrics(scroller, { scrollHeight: 1_000, clientHeight: 200 });
  const counts = listenerCounts(scroller, 'scroll');
  const target = { current: scroller };
  const mounted = await mount(h(ScrollProbe, { target }));

  assert.equal(mounted.container.textContent, '0');
  assert.equal(counts.added(), 1);

  for (const [scrollTop, expected] of [
    [400, '0.5'],
    [900, '1'],
    [-20, '0'],
  ]) {
    scroller.scrollTop = scrollTop;
    await act(async () => {
      scroller.dispatchEvent(new Event('scroll'));
      flushFrames();
    });
    assert.equal(mounted.container.textContent, expected);
  }

  // State updates and rerenders keep one subscription rather than stacking listeners.
  assert.equal(counts.added(), 1);
  await mounted.unmount();
  assert.equal(counts.removed(), 1);
  assert.equal(frames.size, 0);
});

test('useScrollProgress follows a replaced ref target', async () => {
  const first = document.createElement('div');
  const second = document.createElement('div');
  defineScrollMetrics(first, { scrollHeight: 1_000, clientHeight: 200, scrollTop: 200 });
  defineScrollMetrics(second, { scrollHeight: 1_000, clientHeight: 200, scrollTop: 600 });
  const firstCounts = listenerCounts(first, 'scroll');
  const secondCounts = listenerCounts(second, 'scroll');
  const target = { current: first };
  const mounted = await mount(h(ScrollProbe, { target }));
  assert.equal(mounted.container.textContent, '0.25');

  target.current = second;
  await act(async () => mounted.root.render(h(ScrollProbe, { target, revision: 1 })));
  assert.equal(mounted.container.textContent, '0.75');
  assert.equal(firstCounts.removed(), 1);
  assert.equal(secondCounts.added(), 1);

  first.scrollTop = 800;
  await act(async () => {
    first.dispatchEvent(new Event('scroll'));
    flushFrames();
  });
  assert.equal(mounted.container.textContent, '0.75');

  await mounted.unmount();
  assert.equal(secondCounts.removed(), 1);
});

function SectionProbe({ hrefs, target, revision = 0 }) {
  const reading = useSectionProgress(hrefs, { target });
  return h(
    'output',
    { 'data-revision': revision },
    `${reading.activeHref ?? ''}|${reading.scrollProgress}`,
  );
}

test('useSectionProgress tracks unequal sections and reaches a short final section', async () => {
  const scroller = document.createElement('div');
  defineScrollMetrics(scroller, { scrollHeight: 1_800, clientHeight: 600 });
  scroller.getBoundingClientRect = () => ({ top: 100 });
  document.body.append(scroller);

  const positions = new Map([
    ['audit-intro', 0],
    ['audit-work', 600],
    ['audit-end', 1_400],
  ]);
  for (const [id, top] of positions) {
    const section = document.createElement('section');
    section.id = id;
    section.getBoundingClientRect = () => ({
      top: 100 + top - scroller.scrollTop,
    });
    scroller.append(section);
  }

  const target = { current: scroller };
  const mounted = await mount(
    h(SectionProbe, {
      target,
      hrefs: ['#audit-intro', '#audit-work', '#audit-end'],
    }),
  );
  assert.equal(mounted.container.textContent, '#audit-intro|0');

  scroller.scrollTop = 700;
  await act(async () => {
    scroller.dispatchEvent(new Event('scroll'));
    flushFrames();
  });
  assert.equal(mounted.container.textContent, '#audit-work|0.5625');

  scroller.scrollTop = 1_200;
  await act(async () => {
    scroller.dispatchEvent(new Event('scroll'));
    flushFrames();
  });
  assert.equal(mounted.container.textContent, '#audit-end|1');

  await mounted.unmount();
  scroller.remove();
});

test('useSectionProgress clears missing sections and preserves commas in ids', async () => {
  const comma = document.createElement('section');
  comma.id = 'audit,comma';
  comma.getBoundingClientRect = () => ({ top: 0 });
  document.body.append(comma);

  const mounted = await mount(h(SectionProbe, { hrefs: ['#audit,comma'] }));
  assert.equal(mounted.container.textContent, '#audit,comma|0');

  await act(async () =>
    mounted.root.render(h(SectionProbe, { hrefs: ['#does-not-exist'], revision: 1 })),
  );
  assert.equal(mounted.container.textContent, '|0');

  await mounted.unmount();
  comma.remove();
});

test('useSectionProgress discovers a section that mounts later', async () => {
  const mounted = await mount(h(SectionProbe, { hrefs: ['#audit-late'] }));
  assert.equal(mounted.container.textContent, '|0');

  const late = document.createElement('section');
  late.id = 'audit-late';
  late.getBoundingClientRect = () => ({ top: 0 });
  await act(async () => {
    document.body.append(late);
    await new Promise((resolve) => setTimeout(resolve, 0));
    flushFrames();
  });
  assert.equal(mounted.container.textContent, '#audit-late|0');

  await mounted.unmount();
  late.remove();
});

test('reduced-motion preference updates the rendered contract and cleans up', async () => {
  let changeListener;
  let removed = 0;
  dom.window.matchMedia = () => ({
    matches: false,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener(type, listener) {
      if (type === 'change') changeListener = listener;
    },
    removeEventListener(type, listener) {
      if (type === 'change' && listener === changeListener) removed += 1;
    },
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return true;
    },
  });

  const mounted = await mount(
    h(Pokenav, {
      position: 'left',
      orientation: 'vertical',
      items: [{ label: 'Home', href: '/', spriteUrl: '/home.png' }],
    }),
  );
  assert.equal(mounted.container.querySelector('[data-reduced-motion]'), null);

  await act(async () => changeListener({ matches: true }));
  assert.ok(mounted.container.querySelector('[data-reduced-motion]'));

  await mounted.unmount();
  assert.equal(removed, 1);
});
