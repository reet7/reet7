import { wrap } from '../../core/math';

const DIM = 0.22;

export interface CarouselInfo {
  /** Syncs the text tracks and name list to a carousel position. */
  update(position: number): void;
  measure(): void;
}

/** Shortest signed distance from `position` to `index` on a loop of `count`. */
function loopDistance(index: number, position: number, count: number): number {
  const distance = wrap(index - position, count);
  return distance > count / 2 ? distance - count : distance;
}

/**
 * The info row under the hairline. Each field is an odometer: the value for every project
 * is stacked in a one-line window and slides vertically with the carousel.
 */
export function createCarouselInfo(root: HTMLElement): CarouselInfo {
  const tracks = [...root.querySelectorAll<HTMLElement>('[data-track]')].map((track) => ({
    track,
    items: [...track.children] as HTMLElement[],
  }));
  const names = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  let lineHeight = 0;

  return {
    measure() {
      lineHeight = tracks[0]?.track.clientHeight ?? 0;
    },
    update(position) {
      for (const { items } of tracks) {
        items.forEach((item, index) => {
          const distance = loopDistance(index, position, items.length);
          const visible = Math.abs(distance) < 1;
          item.style.opacity = visible ? String(1 - Math.abs(distance)) : '0';
          item.style.transform = visible ? `translateY(${distance * lineHeight}px)` : '';
        });
      }
      names.forEach((name, index) => {
        const closeness = Math.max(0, 1 - Math.abs(loopDistance(index, position, names.length)));
        name.style.setProperty('--proximity', String(DIM + (1 - DIM) * closeness));
      });
    },
  };
}
