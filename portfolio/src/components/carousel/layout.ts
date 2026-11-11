import { media } from '../../core/env';
import { lerp, smoothstep, wrap } from '../../core/math';
import type { Viewport } from '../../core/viewport';

const ASPECT = 3 / 2;
const SIDE_SCALE = 0.64;
const GAP_REM = 0.5;
const GRID_COLUMNS = 12;
const CARD_COLUMNS = 4;
const PORTRAIT_WIDTH = 0.75;

export interface StackMetrics {
  readonly viewWidth: number;
  readonly viewHeight: number;
  /** Vertical centre of the stack in viewport pixels. */
  readonly centerY: number;
  readonly cardWidth: number;
  readonly cardHeight: number;
  readonly gap: number;
  /** Distance between the centre card and its neighbour; one carousel step in pixels. */
  readonly step: number;
  readonly portrait: boolean;
}

/** One visible card: which project it shows and where it sits. Coordinates are viewport pixels. */
export interface Slot {
  project: number;
  /** Signed distance from the centre position in carousel steps. */
  distance: number;
  centerY: number;
  width: number;
  height: number;
  /** 1 on the centre card, falling to 0 one step away. */
  activeness: number;
}

/**
 * The centre card spans four grid columns on desktop and 75% of the width in the
 * portrait stack; the stack is centred between the header block and the bottom edge.
 */
export function measureStack(
  viewport: Viewport,
  headerBottom: number,
  margin: number,
): StackMetrics {
  const portrait = media.portraitStack.matches;
  const column = (viewport.width - 2 * margin - (GRID_COLUMNS - 1) * viewport.rem) / GRID_COLUMNS;
  const cardWidth = portrait
    ? viewport.width * PORTRAIT_WIDTH
    : CARD_COLUMNS * column + (CARD_COLUMNS - 1) * viewport.rem;
  const cardHeight = cardWidth / ASPECT;
  const gap = GAP_REM * viewport.rem;
  return {
    viewWidth: viewport.width,
    viewHeight: viewport.height,
    centerY: (headerBottom + viewport.height) / 2,
    cardWidth,
    cardHeight,
    gap,
    step: (cardHeight * (1 + SIDE_SCALE)) / 2 + gap,
    portrait,
  };
}

export const activeness = (distance: number): number => 1 - smoothstep(0, 1, Math.abs(distance));

function place(slot: Slot, project: number, distance: number, metrics: StackMetrics): void {
  const active = activeness(distance);
  const scale = lerp(SIDE_SCALE, 1, active);
  slot.project = project;
  slot.distance = distance;
  slot.activeness = active;
  slot.width = metrics.cardWidth * scale;
  slot.height = metrics.cardHeight * scale;
}

/**
 * Fills `slots` with every card that intersects the viewport for a carousel `position`
 * (in steps; integers are rest positions) and returns how many are in use. The stack is
 * infinite: projects repeat above and below.
 */
export function layoutStack(
  slots: Slot[],
  position: number,
  projectCount: number,
  metrics: StackMetrics,
): number {
  const nearest = Math.round(position);
  const offset = nearest - position;
  let used = 0;

  const take = (): Slot => {
    const slot = (slots[used] ??= {
      project: 0,
      distance: 0,
      centerY: 0,
      width: 0,
      height: 0,
      activeness: 0,
    });
    used += 1;
    return slot;
  };

  const center = take();
  place(center, wrap(nearest, projectCount), offset, metrics);
  center.centerY = metrics.centerY + offset * metrics.step;

  for (const direction of [1, -1]) {
    let previous = center;
    for (let k = 1; ; k++) {
      const edge = previous.centerY + (direction * previous.height) / 2;
      if (edge < 0 || edge > metrics.viewHeight) break;
      const slot = take();
      place(slot, wrap(nearest + direction * k, projectCount), offset + direction * k, metrics);
      slot.centerY = edge + direction * (metrics.gap + slot.height / 2);
      previous = slot;
    }
  }
  return used;
}
