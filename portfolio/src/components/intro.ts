import { gsap } from 'gsap';
import { qs, qsa, reducedMotion } from '../core/env';
import type { ProjectList } from './project-list';
import { splitLines } from './split';

const KEY = 'intro-seen';
// Loader stops and phase timings mirror the reference: 47% → 53% → 100%, then letters, then the header lifts.
const STOPS = [47, 53, 100];
const TOP_DUR = 1.6;
const TOP_AT = 0.7;

function revealTargets() {
  return {
    top: qs('.top')!,
    letters: qsa('.wm-inner'),
    navW: qs('.nav-w')!,
    navText: qsa('.nav .mask-in'),
    count: qs('[data-count]')!,
    stage: qs('[data-stage]')!,
    line: qs('[data-work-line]'),
    row: qsa('[data-row] > *'),
    names: qsa('[data-name]'),
    foot: qsa('.home .foot > *'),
    tagline: qs<HTMLElement>('.intro-text .split'),
  };
}

export function playHomeIntro(list: ProjectList): Promise<void> {
  const t = revealTargets();
  const html = document.documentElement;
  const first = !sessionStorage.getItem(KEY);
  const lines = t.tagline ? splitLines(t.tagline).lines : [];
  html.classList.remove('is-loading');

  if (reducedMotion()) {
    sessionStorage.setItem(KEY, '1');
    list.set(0);
    return Promise.resolve();
  }

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  gsap.set(t.navText, { yPercent: 110 });
  gsap.set(lines, { yPercent: 110 });
  gsap.set([...t.row, ...t.foot], { opacity: 0, y: 12 });
  if (t.line) gsap.set(t.line, { scaleX: 0 });

  if (first) {
    const lift = innerHeight - t.top.getBoundingClientRect().bottom - parseFloat(getComputedStyle(t.top).paddingTop);
    const counter = { v: 0 };
    gsap.set(t.top, { y: lift });
    gsap.set(t.letters, { yPercent: 105 });
    gsap.set(t.navW, { scaleX: 0, transformOrigin: '0 50%' });
    gsap.set(t.count, { opacity: 1 });
    gsap.set(t.stage, { y: innerHeight * 0.9 });
    list.set(-list.count * 1.5);
    const step = (v: number, dur: number) =>
      tl.to(counter, {
        v,
        duration: dur,
        ease: 'power2.inOut',
        onUpdate: () => {
          t.count.textContent = `${Math.round(counter.v)}%`;
          gsap.set(t.navW, { scaleX: counter.v / 100 });
        },
      });
    step(STOPS[0], 0.9);
    step(STOPS[1], 0.5);
    const fonts = document.fonts?.ready ?? Promise.resolve();
    tl.add(() => {
      tl.pause();
      fonts.then(() => tl.resume());
    });
    step(STOPS[2], 0.8);
    tl.to(t.count, { opacity: 0, duration: 0.3 }, '+=0.1');
    tl.to(t.letters, { yPercent: 0, duration: 1.2, stagger: 0.06 }, '<');
    tl.addLabel('lift', `<${TOP_AT}`);
    tl.to(t.top, { y: 0, duration: TOP_DUR, ease: 'expo.inOut' }, 'lift');
    tl.to(t.stage, { y: 0, duration: TOP_DUR, ease: 'expo.inOut' }, 'lift');
    tl.add(() => void list.to(0, { duration: 2.4, ease: 'expo.out' }), 'lift+=0.2');
    tl.addLabel('info', `lift+=${TOP_DUR - 0.4}`);
  } else {
    gsap.set(t.letters, { yPercent: 105 });
    gsap.set(t.stage, { opacity: 0 });
    list.set(-1.5);
    tl.to(t.letters, { yPercent: 0, duration: 1.2, stagger: 0.05 });
    tl.to(t.stage, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.1);
    tl.add(() => void list.to(0, { duration: 1.8, ease: 'expo.out' }), 0.1);
    tl.addLabel('info', 0.4);
  }

  tl.to(t.navText, { yPercent: 0, duration: 1, stagger: 0.035 }, 'info');
  if (t.line) tl.to(t.line, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 'info');
  tl.to(t.row, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 'info+=0.4');
  tl.to(lines, { yPercent: 0, duration: 1.1, stagger: 0.08 }, 'info+=0.5');
  tl.to(t.foot, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 'info+=0.6');

  return new Promise((resolve) => {
    tl.eventCallback('onComplete', () => {
      sessionStorage.setItem(KEY, '1');
      gsap.set([t.top, t.stage, t.navW], { clearProps: 'transform' });
      resolve();
    });
  });
}
