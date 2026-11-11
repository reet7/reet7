import { gsap } from 'gsap';
import { disposer, isTouch, qs } from '../core/env';

export interface Cursor {
  show(label: string): void;
  hide(): void;
  destroy(): void;
}

export function initCursor(): Cursor {
  const d = disposer();
  const el = qs('[data-cursor]');
  const label = qs('[data-cursor-label]');
  const noop: Cursor = { show: () => {}, hide: () => {}, destroy: d.run };
  if (!el || !label || isTouch()) return noop;
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { ...pos };
  const setX = gsap.quickSetter(el, 'x', 'px');
  const setY = gsap.quickSetter(el, 'y', 'px');
  const tick = (): void => {
    pos.x += (target.x - pos.x) * 0.18;
    pos.y += (target.y - pos.y) * 0.18;
    setX(pos.x);
    setY(pos.y);
  };
  gsap.ticker.add(tick);
  d.add(() => gsap.ticker.remove(tick));
  d.on(window, 'pointermove', ((e: PointerEvent) => {
    target.x = e.clientX;
    target.y = e.clientY;
  }) as EventListener);
  return {
    show(text) {
      label.textContent = text;
      gsap.to(el, { scale: 1, opacity: 1, duration: 0.4, ease: 'expo.out', overwrite: 'auto' });
    },
    hide() {
      gsap.to(el, { scale: 0, opacity: 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
    },
    destroy: d.run,
  };
}
