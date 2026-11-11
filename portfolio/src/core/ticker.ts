import { gsap } from 'gsap';
import type { Cleanup } from './lifecycle';

const MAX_DELTA = 0.1;

export type FrameHandler = (delta: number, elapsed: number) => void;

/**
 * Subscribes to the single shared animation loop (GSAP's ticker), which already pauses
 * while the tab is hidden. `delta` and `elapsed` are in seconds.
 */
export function onFrame(handler: FrameHandler): Cleanup {
  const tick = (elapsed: number, deltaMs: number): void => {
    handler(Math.min(deltaMs / 1000, MAX_DELTA), elapsed);
  };
  gsap.ticker.add(tick);
  return () => {
    gsap.ticker.remove(tick);
  };
}
