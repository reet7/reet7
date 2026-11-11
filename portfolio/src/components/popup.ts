import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { media, prefersReducedMotion } from '../core/env';
import { tick } from '../core/feedback';
import type { Scope } from '../core/lifecycle';
import { damp } from '../core/math';
import type { ScrollController } from '../core/scroll';
import { onFrame } from '../core/ticker';

const CURSOR_LERP = 0.18;
const BACKDROP_OPEN = { backgroundColor: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(10px)' };
const BACKDROP_CLOSED = { backgroundColor: 'rgba(0, 0, 0, 0)', backdropFilter: 'blur(0px)' };

interface Popup {
  readonly dialog: HTMLDialogElement;
  timeline: gsap.core.Timeline | null;
  splits: SplitText[];
  closing: boolean;
}

/** Follows the pointer with an "X" while a popup is open on mouse-driven screens. */
function createCursor(dialog: HTMLDialogElement, scope: Scope): void {
  const cursor = dialog.querySelector<HTMLElement>('[data-popup-cursor]');
  if (!cursor) return;
  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const current = { ...target };

  scope.listen<PointerEvent>(dialog, 'pointermove', (event) => {
    target.x = event.clientX;
    target.y = event.clientY;
    const overControl = event.target instanceof Element && event.target.closest('a, button');
    cursor.style.opacity = overControl ? '0' : '1';
  });
  scope.add(
    onFrame((delta) => {
      if (!dialog.open || !media.desktopPointer.matches) return;
      current.x = damp(current.x, target.x, CURSOR_LERP, delta);
      current.y = damp(current.y, target.y, CURSOR_LERP, delta);
      cursor.style.transform = `translate(${current.x}px, ${current.y}px)`;
    }),
  );
}

function open(popup: Popup, scroll: ScrollController): void {
  const { dialog } = popup;
  if (dialog.open) return;
  tick();
  scroll.lock();
  dialog.showModal();
  history.replaceState(null, '', `#${dialog.id}`);
  popup.closing = false;

  const image = dialog.querySelector('[data-popup-image]');
  const button = dialog.querySelector('[data-popup-button]');
  const close = dialog.querySelector('[data-popup-close]');
  const texts = [...dialog.querySelectorAll<HTMLElement>('[data-popup-text]')];
  popup.splits = texts.map((text) =>
    SplitText.create(text, { type: 'lines', mask: 'lines', linesClass: 'line' }),
  );

  const timeline = gsap
    .timeline()
    .fromTo(dialog, BACKDROP_CLOSED, { ...BACKDROP_OPEN, duration: 0.8, ease: 'power2.out' }, 0)
    .fromTo(
      image,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
      0.1,
    )
    .fromTo(
      image?.firstElementChild ?? null,
      { scale: 1.05 },
      { scale: 1, duration: 1.6, ease: 'expo.inOut' },
      0.1,
    )
    .fromTo(
      button,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
      0.35,
    )
    .fromTo(close, { opacity: 0 }, { opacity: 1, duration: 0.4, clearProps: 'opacity' }, 0.6);
  popup.splits.forEach((split, index) => {
    timeline.from(
      split.lines,
      { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.08 },
      0.55 + 0.12 * index,
    );
  });
  if (prefersReducedMotion()) timeline.timeScale(4);
  popup.timeline = timeline;
}

function close(popup: Popup, scroll: ScrollController): void {
  const { dialog } = popup;
  if (!dialog.open || popup.closing) return;
  popup.closing = true;
  tick();
  popup.timeline?.kill();

  const image = dialog.querySelector('[data-popup-image]');
  const button = dialog.querySelector('[data-popup-button]');
  const lines = popup.splits.flatMap((split) => split.lines);

  const timeline = gsap
    .timeline({
      onComplete: () => {
        for (const split of popup.splits) split.revert();
        popup.splits = [];
        dialog.close();
        scroll.unlock();
        history.replaceState(null, '', location.pathname + location.search);
      },
    })
    .to(lines, { yPercent: -110, duration: 0.5, ease: 'power3.in', stagger: 0.03 }, 0)
    .to([image, button], { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0)
    .to(image?.firstElementChild ?? null, { scale: 1.05, duration: 0.9, ease: 'expo.inOut' }, 0)
    .to(dialog, { ...BACKDROP_CLOSED, duration: 0.7, ease: 'power2.inOut' }, 0.45);
  if (prefersReducedMotion()) timeline.timeScale(4);
  popup.timeline = timeline;
}

/**
 * Full-screen detail popups built on `<dialog>`, which provides the focus trap, inertness
 * of the page behind and focus return. Opened by `[data-popup-open="<id>"]` links.
 */
export function initPopups(scope: Scope, scroll: ScrollController): void {
  gsap.registerPlugin(SplitText);
  const popups = new Map<string, Popup>();

  for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[data-popup]')) {
    const popup: Popup = { dialog, timeline: null, splits: [], closing: false };
    popups.set(dialog.id, popup);
    createCursor(dialog, scope);

    scope.listen(dialog, 'cancel', (event) => {
      event.preventDefault();
      close(popup, scroll);
    });
    scope.listen<MouseEvent>(dialog, 'click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[data-popup-close]') || !target?.closest('a, button')) {
        close(popup, scroll);
      }
    });
    scope.add(() => {
      popup.timeline?.kill();
      if (dialog.open) dialog.close();
    });
  }

  for (const opener of document.querySelectorAll<HTMLElement>('[data-popup-open]')) {
    const popup = popups.get(opener.dataset.popupOpen ?? '');
    if (!popup) continue;
    scope.listen(opener, 'click', (event) => {
      event.preventDefault();
      open(popup, scroll);
    });
  }

  const linked = popups.get(location.hash.slice(1));
  if (linked) open(linked, scroll);
}
