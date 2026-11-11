import type { Cleanup } from './lifecycle';

export interface Viewport {
  readonly width: number;
  readonly height: number;
  /** Pixels per rem. */
  readonly rem: number;
}

export type ResizeHandler = (viewport: Viewport) => void;

const handlers = new Set<ResizeHandler>();
let current: Viewport | null = null;
let frame = 0;

function measure(): Viewport {
  return {
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
    rem: parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
  };
}

function flush(): void {
  frame = 0;
  current = measure();
  for (const handler of handlers) handler(current);
}

function schedule(): void {
  if (frame === 0) frame = requestAnimationFrame(flush);
}

export function getViewport(): Viewport {
  current ??= measure();
  return current;
}

/** The one resize pipeline: every subscriber is called once per frame with fresh measurements. */
export function onResize(handler: ResizeHandler): Cleanup {
  if (handlers.size === 0) window.addEventListener('resize', schedule, { passive: true });
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
    if (handlers.size > 0) return;
    window.removeEventListener('resize', schedule);
    cancelAnimationFrame(frame);
    frame = 0;
    current = null;
  };
}
