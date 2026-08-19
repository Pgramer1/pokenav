import { useEffect, useLayoutEffect, useState } from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Turns a ref target into reactive state for scroll hooks.
 *
 * Ref objects are stable while their `.current` element can mount, unmount, or be replaced.
 * Depending on the ref object alone leaves a hook subscribed to the old element forever.
 * Checking after every commit catches those changes; identical elements do not cause a
 * state update or listener churn.
 */
export function useRefTarget(
  target: React.RefObject<HTMLElement | null> | undefined,
): HTMLElement | null {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const next = target?.current ?? null;
    setElement((current) => (current === next ? current : next));
  });

  return element;
}
