'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Copy-to-clipboard button, shared by the picker output, the usage examples and the install
 * command. All three previously carried their own copy handler and their own `copied` timer;
 * one component keeps the label, the timeout and the failure behavior identical everywhere.
 */
export function CopyButton({
  value,
  className = 'copy',
  label = 'Copy',
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Without this, unmounting mid-timeout (switching pages right after a copy) leaves a
  // pending setState on a dead component.
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      // Clipboard access can be refused outright — over plain http, or by permission policy.
      // Saying so beats a button that silently does nothing.
      setState('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1600);
  };

  return (
    <button
      type="button"
      className={className}
      onClick={copy}
      data-state={state === 'idle' ? undefined : state}
    >
      <span className="copyIcon" aria-hidden="true">
        {state === 'copied' ? <CheckIcon /> : <ClipboardIcon />}
      </span>
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Failed' : label}
    </button>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5.25" y="2.25" width="8.5" height="10.5" rx="1.5" />
      <path d="M10.75 13.75H3.75a1.5 1.5 0 0 1-1.5-1.5V4.25" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}
