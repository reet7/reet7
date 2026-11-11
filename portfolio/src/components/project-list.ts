import { gsap } from 'gsap';
import { disposer, isMobile, qs, qsa, reducedMotion, rem } from '../core/env';
import { haptic } from '../core/haptics';

export interface CardLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
}

export interface ProjectList {
  readonly count: number;
  readonly cards: HTMLElement[];
  /** Current continuous position (index units). */
  progress(): number;
  velocity(): number;
  active(): number;
  layout(i: number): CardLayout;
  lineY(): number;
  set(p: number): void;
  to(p: number, opts?: { duration?: number; ease?: string }): gsap.core.Tween;
  goTo(i: number): void;
  enable(on: boolean): void;
  onFrame(fn: () => void): void;
  destroy(): void;
}

// Proportions from the reference: inactive cards are 64% of the active width and square, 0.5rem apart.
const SMALL = 0.64;
const LERP = 0.085;
const WHEEL = 0.0016;

export function initProjectList(onChange: (i: number) => void): ProjectList {
  const d = disposer();
  const stage = qs('[data-stage]')!;
  const home = qs('[data-home]')!;
  const cards = qsa('[data-card]', stage);
  const n = cards.length;
  const state = { current: 0, target: 0, vel: 0, enabled: false, active: -1, dragging: false, tween: null as gsap.core.Tween | null };
  const frameFns: Array<() => void> = [];
  let snapTimer = 0;
  let dims = measure();

  function measure() {
    const vw = innerWidth;
    const vh = innerHeight;
    const gap = 0.5 * rem();
    const nav = qs('[data-nav]')!.getBoundingClientRect();
    const aw = isMobile() ? vw * 0.75 : Math.min(vw * 0.318, vh * 0.6);
    const ah = aw / 1.5;
    const sw = aw * SMALL;
    const lineY = (nav.bottom + vh) / 2;
    return { vw, vh, gap, aw, ah, sw, sh: sw, lineY };
  }

  const wrap = (x: number): number => {
    let r = (((x % n) + n) % n);
    if (r >= n / 2) r -= n;
    return r;
  };

  function layout(i: number): CardLayout {
    const { aw, ah, sw, sh, gap, lineY, vw } = dims;
    const dd = wrap(i - state.current);
    const ad = Math.abs(dd);
    const t = Math.max(0, 1 - ad);
    const e = t * t * (3 - 2 * t);
    const w = sw + (aw - sw) * e;
    const h = sh + (ah - sh) * e;
    const first = ah / 2 + gap + sh / 2;
    const off = ad <= 1 ? first * ad : first + (ad - 1) * (sh + gap);
    return { x: vw / 2 - w / 2, y: lineY + Math.sign(dd) * off - h / 2, w, h, d: dd };
  }

  function render(): void {
    cards.forEach((card, i) => {
      const l = layout(i);
      const fade = Math.min(1, Math.max(0, (n / 2 - Math.abs(l.d)) / 0.35));
      card.style.width = `${l.w}px`;
      card.style.height = `${l.h}px`;
      card.style.transform = `translate3d(${l.x - dims.vw / 2}px, ${l.y}px, 0)`;
      card.style.opacity = String(fade);
      card.style.zIndex = String(10 - Math.round(Math.abs(l.d) * 2));
    });
    const a = ((Math.round(state.current) % n) + n) % n;
    if (a !== state.active) {
      const first = state.active === -1;
      state.active = a;
      cards.forEach((c, i) => {
        c.classList.toggle('is-active', i === a);
        const link = qs<HTMLAnchorElement>('[data-card-link]', c);
        if (link) link.tabIndex = i === a ? 0 : -1;
      });
      onChange(a);
      if (!first && state.enabled) haptic();
    }
    frameFns.forEach((fn) => fn());
  }

  const tick = (): void => {
    if (!state.tween) {
      const prev = state.current;
      state.current += (state.target - state.current) * (reducedMotion() ? 1 : LERP);
      if (Math.abs(state.target - state.current) < 1e-4) state.current = state.target;
      state.vel = state.current - prev;
    }
    render();
  };
  gsap.ticker.add(tick);
  d.add(() => gsap.ticker.remove(tick));

  const snap = (): void => {
    state.target = Math.round(state.target);
  };
  const scheduleSnap = (ms = 140): void => {
    clearTimeout(snapTimer);
    snapTimer = window.setTimeout(snap, ms);
  };

  d.on(home, 'wheel', ((e: WheelEvent) => {
    if (!state.enabled) return;
    e.preventDefault();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const unit = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1;
    state.target += Math.max(-0.6, Math.min(0.6, delta * unit * WHEEL));
    scheduleSnap();
  }) as EventListener, { passive: false });

  let startY = 0;
  let startT = 0;
  let lastY = 0;
  let lastTime = 0;
  let flick = 0;
  let moved = false;
  d.on(home, 'pointerdown', ((e: PointerEvent) => {
    if (!state.enabled || e.button !== 0 || (e.target as Element).closest('a:not([data-card-link]), button')) return;
    state.dragging = true;
    moved = false;
    startY = lastY = e.clientY;
    startT = state.target;
    lastTime = performance.now();
    flick = 0;
  }) as EventListener);
  d.on(window, 'pointermove', ((e: PointerEvent) => {
    if (!state.dragging) return;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > 6) moved = true;
    const now = performance.now();
    flick = (e.clientY - lastY) / Math.max(1, now - lastTime);
    lastY = e.clientY;
    lastTime = now;
    state.target = startT - dy / (dims.sh + dims.gap);
  }) as EventListener);
  const end = (): void => {
    if (!state.dragging) return;
    state.dragging = false;
    if (moved) state.target = Math.round(state.target - flick * 0.6);
    snap();
  };
  d.on(window, 'pointerup', end);
  d.on(window, 'pointercancel', end);
  // Swallow the click that ends a drag so it doesn't open a project.
  d.on(stage, 'click', ((e: MouseEvent) => {
    if (moved) {
      e.preventDefault();
      e.stopImmediatePropagation();
      moved = false;
    }
  }) as EventListener, { capture: true });

  d.on(document, 'keydown', ((e: KeyboardEvent) => {
    if (!state.enabled || (e.target as Element).closest('input, textarea, [data-contact]:not([hidden])')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { state.target = Math.round(state.target) + 1; e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { state.target = Math.round(state.target) - 1; e.preventDefault(); }
  }) as EventListener);

  d.on(window, 'resize', () => {
    dims = measure();
    render();
  });

  const api: ProjectList = {
    count: n,
    cards,
    progress: () => state.current,
    velocity: () => state.vel,
    active: () => state.active,
    layout,
    lineY: () => dims.lineY,
    set(p) {
      state.current = state.target = p;
      render();
    },
    to(p, opts = {}) {
      state.tween?.kill();
      const proxy = { v: state.current };
      state.target = p;
      state.tween = gsap.to(proxy, {
        v: p,
        duration: opts.duration ?? 1.2,
        ease: opts.ease ?? 'expo.out',
        onUpdate: () => {
          state.vel = proxy.v - state.current;
          state.current = proxy.v;
        },
        onComplete: () => {
          state.tween = null;
          state.vel = 0;
        },
      });
      return state.tween;
    },
    goTo(i) {
      state.target = Math.round(state.target) + wrap(i - state.target);
    },
    enable(on) {
      state.enabled = on;
    },
    onFrame(fn) {
      frameFns.push(fn);
    },
    destroy() {
      clearTimeout(snapTimer);
      state.tween?.kill();
      d.run();
    },
  };
  render();
  return api;
}
