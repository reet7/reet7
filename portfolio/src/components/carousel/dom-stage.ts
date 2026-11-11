import type { Scope } from '../../core/lifecycle';
import type { Stage, StageSource } from './stage';

/** Stand-in for the WebGL stage: the same stack built from positioned images, without the warp. */
export function createDomStage(
  container: HTMLElement,
  sources: readonly StageSource[],
  scope: Scope,
): Stage {
  const pool: HTMLImageElement[] = [];
  let hidden: number | null = null;

  const slide = (index: number): HTMLImageElement => {
    let image = pool[index];
    if (!image) {
      image = document.createElement('img');
      image.className = 'work__slide';
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      container.append(image);
      pool[index] = image;
    }
    return image;
  };

  scope.add(() => {
    for (const image of pool) image.remove();
  });

  return {
    ready: Promise.resolve(),
    resize: () => undefined,
    setHidden(project) {
      hidden = project;
    },
    render({ slots, slotCount, metrics, offsetY }) {
      for (let i = 0; i < Math.max(slotCount, pool.length); i++) {
        const image = slide(i);
        const slot = i < slotCount ? slots[i] : undefined;
        const source = slot ? sources[slot.project] : undefined;
        if (!slot || !source || slot.project === hidden) {
          image.hidden = true;
          continue;
        }
        image.hidden = false;
        if (image.dataset.src !== source.cover) {
          image.dataset.src = source.cover;
          image.src = source.cover;
        }
        const x = metrics.viewWidth / 2 - slot.width / 2;
        const y = slot.centerY + offsetY - slot.height / 2;
        image.style.width = `${slot.width}px`;
        image.style.height = `${slot.height}px`;
        image.style.transform = `translate(${x}px, ${y}px)`;
        image.style.filter = `grayscale(${1 - slot.activeness})`;
        image.style.opacity = String(0.7 + 0.3 * slot.activeness);
      }
    },
  };
}
