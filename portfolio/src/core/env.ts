const mq = (q: string): MediaQueryList => window.matchMedia(q);

export const reducedMotion = (): boolean => mq('(prefers-reduced-motion: reduce)').matches;
export const isTouch = (): boolean => mq('(hover: none), (pointer: coarse)').matches;
export const isMobile = (): boolean => mq('(max-width: 767px)').matches;

export function rem(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

export function qs<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(sel);
}

export function qsa<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

export interface Disposable {
  destroy(): void;
}

/** Collects teardown callbacks so every module can expose a single destroy(). */
export function disposer(): { add(fn: () => void): void; on<K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: EventListener, opts?: AddEventListenerOptions): void; run(): void } {
  const fns: Array<() => void> = [];
  return {
    add: (fn) => fns.push(fn),
    on: (t, type, fn, opts) => {
      t.addEventListener(type, fn, opts);
      fns.push(() => t.removeEventListener(type, fn, opts));
    },
    run: () => fns.splice(0).reverse().forEach((fn) => fn()),
  };
}
