import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionProgress, sectionTopInContent } from '../src/sectionProgress.ts';
import { reachedNodeIndex } from '../src/currentNode.ts';

/*
 * Coordinate conversion.
 *
 * These numbers come from an actual browser run against a 500px-tall scroll container
 * holding 600 / 2400 / 600px sections. The first implementation special-cased the document
 * and added `scrollTop` back on afterwards, which was correct for the document and
 * double-counted it for a container — every section then appeared to start twice as far
 * down as it did, so the first section stayed current for the whole scroll.
 */
test('document: a section top converts to its absolute offset', () => {
  // Container is the viewport (top 0). Section 600px down the document, viewport scrolled
  // to 200 → section sits 400px below the viewport top, and 600 down the content.
  assert.equal(sectionTopInContent(400, 0, 200, 0), 600);
  // Unscrolled.
  assert.equal(sectionTopInContent(600, 0, 0, 0), 600);
  // Scrolled past it.
  assert.equal(sectionTopInContent(-400, 0, 1000, 0), 600);
});

test('container: a section top converts relative to the container, not the viewport', () => {
  // Container's box sits 700px down the viewport, scrolled to 620.
  // Section #long starts 600px into the container's content, so its rect top is
  // 700 + 600 - 620 = 680.
  assert.equal(sectionTopInContent(680, 700, 620, 0), 600);
  // The regression: the old form yielded 600 + 620 = 1220, so #long only became current
  // once the container had scrolled twice as far.
  assert.notEqual(sectionTopInContent(680, 700, 620, 0), 1220);
});

test('the activation line shifts the conversion by exactly its own size', () => {
  assert.equal(sectionTopInContent(600, 0, 0, 80), 520);
  assert.equal(sectionTopInContent(680, 700, 620, 80), 520);
});

test('the conversion is invariant to how far the container is scrolled', () => {
  // A section's content offset is a property of the layout, not of the current scroll.
  const containerTop = 700;
  for (let scrollTop = 0; scrollTop <= 3000; scrollTop += 137) {
    // Where the section's rect would be at that scroll position.
    const rectTop = containerTop + 600 - scrollTop;
    assert.equal(sectionTopInContent(rectTop, containerTop, scrollTop, 0), 600);
  }
});

/**
 * Three sections of deliberately unequal height. `long` is 1600px against `short`'s 400px —
 * four times the size, well past the 2x the acceptance criteria asks for — which is what
 * makes document-scroll progress and section progress disagree.
 *
 *   #intro   0    → 600   (600px)
 *   #long    600  → 2200  (1600px)
 *   #short   2200 → 2600  (400px)
 */
const TOPS = [{ top: 0 }, { top: 600 }, { top: 2200 }];
const MAX_SCROLL = 2600;

/** The section a reader at `scrollTop` is actually looking at, independent of the hook. */
function expectedIndex(scrollTop: number): number {
  if (scrollTop >= 2200) return 2;
  if (scrollTop >= 600) return 1;
  return 0;
}

test('the reported index is the section actually in view, at every depth', () => {
  // Swept across the whole page rather than spot-checked at the ends, which is where the
  // old document-scroll approach looked correct and was not.
  for (let scrollTop = 0; scrollTop <= MAX_SCROLL; scrollTop += 25) {
    const { index } = sectionProgress(TOPS, scrollTop, MAX_SCROLL);
    assert.equal(index, expectedIndex(scrollTop), `at scrollTop ${scrollTop}`);
  }
});

/*
 * The property the whole design rests on: NavView recovers the highlighted node from
 * `scrollProgress` with floor(progress × (stops - 1)). If that does not return the index
 * the hook computed, the highlight and `aria-current` land on different nodes — which is
 * exactly what happens when scrollProgress comes from raw document scroll.
 */
test('floor(progress x (stops-1)) round-trips back to the same index', () => {
  for (let scrollTop = 0; scrollTop <= MAX_SCROLL; scrollTop += 5) {
    const { index, progress } = sectionProgress(TOPS, scrollTop, MAX_SCROLL);
    assert.equal(
      reachedNodeIndex(progress, TOPS.length),
      index,
      `at scrollTop ${scrollTop} (progress ${progress})`,
    );
  }
});

test('raw document progress would NOT round-trip — the bug this replaces', () => {
  // Documents why section-space is necessary rather than a stylistic choice.
  let disagreements = 0;
  for (let scrollTop = 0; scrollTop <= MAX_SCROLL; scrollTop += 5) {
    const documentProgress = scrollTop / MAX_SCROLL;
    if (reachedNodeIndex(documentProgress, TOPS.length) !== expectedIndex(scrollTop)) {
      disagreements += 1;
    }
  }
  assert.ok(disagreements > 0, 'expected document-scroll progress to disagree somewhere');
});

test('progress is monotonic and spans the full range', () => {
  let previous = -1;
  for (let scrollTop = 0; scrollTop <= MAX_SCROLL; scrollTop += 5) {
    const { progress } = sectionProgress(TOPS, scrollTop, MAX_SCROLL);
    assert.ok(progress >= previous, `progress went backwards at ${scrollTop}`);
    assert.ok(progress >= 0 && progress <= 1, `progress out of range at ${scrollTop}`);
    previous = progress;
  }
  assert.equal(sectionProgress(TOPS, 0, MAX_SCROLL).progress, 0);
  assert.equal(sectionProgress(TOPS, MAX_SCROLL, MAX_SCROLL).progress, 1);
});

test('each section boundary is where progress crosses its stop', () => {
  // Halfway through the long section is halfway between stop 1 and stop 2.
  const { index, progress } = sectionProgress(TOPS, 600 + 800, MAX_SCROLL);
  assert.equal(index, 1);
  assert.equal(progress, (1 + 0.5) / 2);
});

test('scrolling above the first section keeps the first section current', () => {
  const { index, progress } = sectionProgress([{ top: 300 }, { top: 900 }], 0, 1200);
  assert.equal(index, 0);
  assert.equal(progress, 0);
});

test('degenerate inputs do not produce NaN', () => {
  assert.deepEqual(sectionProgress([], 100, 500), { index: -1, progress: 0 });
  assert.deepEqual(sectionProgress([{ top: 0 }], 100, 500), { index: 0, progress: 0 });
  // Two sections sharing an activation line — zero extent, must not divide by zero.
  const shared = sectionProgress([{ top: 0 }, { top: 0 }, { top: 400 }], 0, 800);
  assert.ok(Number.isFinite(shared.progress));
  // Last section starting past the end of the scroll range.
  const past = sectionProgress([{ top: 0 }, { top: 5000 }], 5000, 400);
  assert.ok(Number.isFinite(past.progress));
});

test('an offset shifts every activation line together', () => {
  const withOffset = [{ top: -80 }, { top: 520 }, { top: 2120 }];
  // With an 80px activation line, section 1 becomes current 80px earlier.
  assert.equal(sectionProgress(TOPS, 560, MAX_SCROLL).index, 0);
  assert.equal(sectionProgress(withOffset, 560, MAX_SCROLL).index, 1);
});
