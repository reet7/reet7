import { destroyHaptics, pulse } from './haptics';
import { initAudio, playTick } from './audio';
import type { Scope } from './lifecycle';

/** One interface tick: sound everywhere it is allowed, plus a light haptic on touch devices. */
export function tick(step = 0): void {
  playTick(step);
  pulse();
}

export function initFeedback(scope: Scope): void {
  initAudio(scope);
  scope.add(destroyHaptics);
  scope.listen<MouseEvent>(document, 'click', (event) => {
    if (event.target instanceof Element && event.target.closest('a[href]')) tick();
  });
}
