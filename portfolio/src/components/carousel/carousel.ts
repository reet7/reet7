import { media, prefersReducedMotion } from '../../core/env';
import { tick } from '../../core/feedback';
import type { Scope } from '../../core/lifecycle';
import { onFrame } from '../../core/ticker';
import { getViewport, onResize } from '../../core/viewport';
import { createCarouselInfo } from './info';
import { layoutStack, measureStack, type Slot, type StackMetrics } from './layout';
import { CarouselMotion } from './motion';
import type { Stage, StageSource } from './stage';

const DRAG_THRESHOLD = 6;
const WHEEL_LINE_PIXELS = 40;
const KEY_STEPS: Record<string, 1 | -1> = {
  ArrowDown: 1,
  ArrowRight: 1,
  PageDown: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
  PageUp: -1,
};

export interface CardRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CarouselOptions {
  readonly createStage: (container: HTMLElement, sources: readonly StageSource[]) => Stage;
  /** Called when the visitor opens the centred project by click, tap or Enter. */
  readonly onOpen: (project: number, link: HTMLAnchorElement, event: Event) => void;
}

export interface Carousel {
  readonly stage: Stage;
  readonly projectCount: number;
  /** Viewport rectangle of the centred card at rest. */
  activeRect(): CardRect;
  /** Drives the carousel directly while the intro plays; input is ignored meanwhile. */
  present(position: number, offsetY: number): void;
  /** Hands control to the visitor. */
  release(): void;
}

function readSources(links: readonly HTMLAnchorElement[]): StageSource[] {
  const small = media.portraitStack.matches;
  return links.map((link) => ({
    cover: (small ? link.dataset.coverSmall : link.dataset.cover) ?? '',
  }));
}

/**
 * The home carousel: an endless vertical stack of project covers steered by wheel, drag,
 * touch and keyboard. This module owns input, layout and the accessible link list; drawing
 * is delegated to a `Stage`.
 */
export function createCarousel(
  root: HTMLElement,
  scope: Scope,
  options: CarouselOptions,
): Carousel {
  const home = root.closest<HTMLElement>('[data-home]') ?? root;
  const header = home.querySelector<HTMLElement>('[data-home-top]');
  const container = root.querySelector<HTMLElement>('[data-stage]') ?? root;
  const status = root.querySelector<HTMLElement>('[data-status]');
  const links = [...root.querySelectorAll<HTMLAnchorElement>('a[data-slide]')];

  const motion = new CarouselMotion(links.length);
  const info = createCarouselInfo(root);
  const stage = options.createStage(container, readSources(links));
  const slots: Slot[] = [];

  let metrics: StackMetrics = measureStack(getViewport(), 0, 0);
  let interactive = false;
  let offsetY = 0;
  let lastIndex = -1;
  let slotCount = 0;
  let wasMoving = true;

  const measure = (): void => {
    const viewport = getViewport();
    const margin = parseFloat(getComputedStyle(home).paddingLeft) || 0;
    const headerBottom = header ? header.offsetTop + header.offsetHeight : 0;
    metrics = measureStack(viewport, headerBottom, margin);
    root.style.setProperty('--work-center', `${metrics.centerY}px`);
    info.measure();
    stage.resize(metrics);
    wasMoving = true;
  };

  const announce = (index: number): void => {
    const label = links[index]?.dataset.label;
    if (status && label) status.textContent = `Project ${index + 1} of ${links.length}: ${label}`;
  };

  const open = (index: number, event: Event): void => {
    const link = links[index];
    if (link) options.onOpen(index, link, event);
  };

  /** Finds the card under a viewport point, if any. */
  const slotAt = (x: number, y: number): Slot | undefined => {
    for (let i = 0; i < slotCount; i++) {
      const slot = slots[i];
      if (!slot) continue;
      const insideX = Math.abs(x - metrics.viewWidth / 2) <= slot.width / 2;
      const insideY = Math.abs(y - slot.centerY - offsetY) <= slot.height / 2;
      if (insideX && insideY) return slot;
    }
    return undefined;
  };

  scope.add(
    onFrame((delta, elapsed) => {
      if (interactive) motion.update(delta, prefersReducedMotion());
      const moving = !interactive || !motion.isResting;
      slotCount = layoutStack(slots, motion.position, links.length, metrics);
      stage.render({
        slots,
        slotCount,
        metrics,
        offsetY,
        warp: motion.warp,
        moving: moving || wasMoving,
        delta,
        elapsed,
      });
      if (moving || wasMoving) info.update(motion.position);
      wasMoving = moving;

      const index = motion.index;
      if (index !== lastIndex) {
        if (lastIndex !== -1) tick(index);
        if (interactive) announce(index);
        lastIndex = index;
      }
    }),
  );
  scope.add(onResize(measure));
  scope.add(motion);
  measure();

  scope.listen<WheelEvent>(
    root,
    'wheel',
    (event) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      if (!interactive) return;
      const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? WHEEL_LINE_PIXELS : 1;
      motion.wheel(event.deltaY * scale, metrics.step);
    },
    { passive: false },
  );

  scope.listen<KeyboardEvent>(document, 'keydown', (event) => {
    const direction = KEY_STEPS[event.key];
    if (!direction || !interactive || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    motion.step(direction);
  });

  let drag: {
    startY: number;
    lastY: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null = null;

  scope.listen<PointerEvent>(root, 'pointerdown', (event) => {
    if (!interactive || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('a, button')) return;
    drag = {
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    };
    motion.dragStart();
  });

  scope.listen<PointerEvent>(window, 'pointermove', (event) => {
    if (drag) {
      const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
      const instant = (drag.lastY - event.clientY) / metrics.step / elapsed;
      drag.velocity += (instant - drag.velocity) * 0.5;
      drag.lastY = event.clientY;
      drag.lastTime = event.timeStamp;
      drag.moved ||= Math.abs(event.clientY - drag.startY) > DRAG_THRESHOLD;
      motion.dragMove((drag.startY - event.clientY) / metrics.step, drag.velocity);
    } else if (media.desktopPointer.matches) {
      const slot = interactive ? slotAt(event.clientX, event.clientY) : undefined;
      container.classList.toggle('is-pointing', slot !== undefined);
    }
  });

  const endDrag = (event: PointerEvent): void => {
    if (!drag) return;
    const { moved, lastTime } = drag;
    if (event.timeStamp - lastTime > 80)
      motion.dragMove((drag.startY - event.clientY) / metrics.step, 0);
    drag = null;
    motion.dragEnd();
    if (moved || event.type === 'pointercancel') return;

    const slot = slotAt(event.clientX, event.clientY);
    if (!slot) return;
    if (Math.abs(slot.distance) < 0.5) open(slot.project, event);
    else motion.goTo(slot.project);
  };
  scope.listen<PointerEvent>(window, 'pointerup', endDrag);
  scope.listen<PointerEvent>(window, 'pointercancel', endDrag);

  links.forEach((link, index) => {
    scope.listen(link, 'focus', () => {
      if (interactive) motion.goTo(index);
    });
    scope.listen<MouseEvent>(link, 'click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!interactive || motion.targetIndex !== index) {
        event.preventDefault();
        if (interactive) motion.goTo(index);
        return;
      }
      open(index, event);
    });
  });

  return {
    stage,
    projectCount: links.length,
    activeRect() {
      return {
        x: (metrics.viewWidth - metrics.cardWidth) / 2,
        y: metrics.centerY - metrics.cardHeight / 2,
        width: metrics.cardWidth,
        height: metrics.cardHeight,
      };
    },
    present(position, offset) {
      motion.jump(position);
      offsetY = offset;
    },
    release() {
      offsetY = 0;
      motion.jump(Math.round(motion.position));
      interactive = true;
      wasMoving = true;
    },
  };
}
