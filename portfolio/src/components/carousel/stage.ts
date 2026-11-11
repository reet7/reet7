import type { Slot, StackMetrics } from './layout';

export interface StageFrame {
  readonly slots: readonly Slot[];
  readonly slotCount: number;
  readonly metrics: StackMetrics;
  /** Extra vertical offset of the whole stack in pixels (the intro drops it in from below). */
  readonly offsetY: number;
  readonly warp: number;
  /** False when nothing in the carousel itself changed since the last frame. */
  readonly moving: boolean;
  readonly delta: number;
  readonly elapsed: number;
}

/**
 * Draws the card stack. Implemented in WebGL, with a DOM stand-in when WebGL is unavailable.
 * Resources are released through the scope the stage was created with.
 */
export interface Stage {
  /** Resolves once every cover can be drawn. */
  readonly ready: Promise<void>;
  resize(metrics: StackMetrics): void;
  render(frame: StageFrame): void;
  /** Hides one project's cards, e.g. while the flight transition carries its image away. */
  setHidden(project: number | null): void;
}

export interface StageSource {
  readonly cover: string;
}
