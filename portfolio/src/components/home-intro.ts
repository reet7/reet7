import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';
import { isViewTransitionActive, type Arrival } from '../core/transitions';
import type { Carousel } from './carousel/carousel';

const STALL_FROM = 47;
const STALL_TO = 53;
const MAX_ASSET_WAIT_MS = 5000;
/** The stack spins through every project this many times before landing on the first. */
const SPIN_LOOPS = 2;
const TRANSITION_DELAY = 0.5;

export interface HomeIntroOptions {
  readonly carousel: Carousel;
  readonly arrival: Arrival;
  /** Resolves when the carousel covers are ready to draw. */
  readonly assets: Promise<void>;
}

interface IntroElements {
  readonly home: HTMLElement;
  readonly top: HTMLElement;
  readonly nav: HTMLElement;
  readonly letters: HTMLElement[];
  readonly navItems: HTMLElement[];
  readonly line: HTMLElement | null;
  readonly tracks: HTMLElement[];
  readonly names: HTMLElement[];
  readonly foot: HTMLElement | null;
  readonly tagline: HTMLElement | null;
}

function collect(home: HTMLElement): IntroElements | null {
  const top = home.querySelector<HTMLElement>('[data-home-top]');
  const nav = home.querySelector<HTMLElement>('[data-nav]');
  if (!top || !nav) return null;
  const all = (selector: string): HTMLElement[] => [
    ...home.querySelectorAll<HTMLElement>(selector),
  ];
  return {
    home,
    top,
    nav,
    letters: all('.wordmark__letter'),
    navItems: all('[data-nav-item], .nav__contact .roll'),
    line: home.querySelector('[data-line]'),
    tracks: all('[data-track]'),
    names: all('[data-slide]'),
    foot: home.querySelector('[data-home-foot]'),
    tagline: home.querySelector('[data-tagline]'),
  };
}

const timeout = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

/** Reveals the lower half of the screen: hairline, info row, footer line and tagline. */
function revealDetails(timeline: gsap.core.Timeline, elements: IntroElements, at: number): void {
  const { line, tracks, names, foot, tagline } = elements;
  timeline
    .to(line, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, at)
    .to(tracks, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.2 }, at + 0.4)
    .to(names, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.04 }, at + 0.6)
    .to(foot, { opacity: 1, duration: 0.8, ease: 'power2.out' }, at + 0.8);
  if (!tagline) return;
  timeline.add(() => {
    const split = SplitText.create(tagline, { type: 'lines', mask: 'lines' });
    gsap.set(tagline, { opacity: 1 });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.08,
      onComplete: () => split.revert(),
    });
  }, at + 1);
}

function hideDetails({ line, tracks, names, foot, tagline }: IntroElements): void {
  gsap.set(line, { scaleX: 0 });
  gsap.set([...tracks, ...names], { yPercent: 110 });
  gsap.set([foot, tagline], { opacity: 0 });
}

/**
 * First visit: the nav strip doubles as a progress bar at the bottom of the screen, then the
 * wordmark unfolds, the header travels to the top and the stack spins in.
 */
function playLoader(elements: IntroElements, { carousel, assets }: HomeIntroOptions): void {
  const { home, top, nav, letters, navItems } = elements;
  const counter = document.createElement('span');
  counter.className = 'nav__progress';
  counter.setAttribute('aria-hidden', 'true');
  nav.append(counter);

  const style = getComputedStyle(home);
  const restY =
    home.clientHeight -
    top.offsetHeight -
    parseFloat(style.paddingTop) -
    parseFloat(style.paddingBottom);
  const spinDistance = carousel.projectCount * SPIN_LOOPS;
  // Far enough that even cards above the centre start below the fold.
  const dropFrom = home.clientHeight * 1.5;
  const state = { progress: 0, spin: 0, drop: dropFrom };

  const showProgress = (): void => {
    const rest = 100 - state.progress;
    nav.style.clipPath = `inset(0 ${rest}% 0 0)`;
    counter.style.right = `${rest}%`;
    counter.textContent = `${Math.round(state.progress)}%`;
  };
  const presentStack = (): void => carousel.present(-spinDistance * (1 - state.spin), state.drop);

  gsap.set(top, { y: restY });
  gsap.set(letters, { yPercent: 100, rotationX: 60 });
  gsap.set(navItems, { yPercent: 110, opacity: 0 });
  hideDetails(elements);
  showProgress();
  presentStack();

  const reveal = gsap
    .timeline({ paused: true })
    .to(counter, { yPercent: -110, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0)
    .to(letters, { yPercent: 0, rotationX: 0, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, 0)
    .to(navItems, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.08 }, 0)
    .to(state, { spin: 1, duration: 3.6, ease: 'power3.inOut', onUpdate: presentStack }, 0.4)
    .to(state, { drop: 0, duration: 1.4, ease: 'power3.out' }, 0.4)
    .to(top, { y: 0, duration: 1.6, ease: 'power3.inOut' }, 0.7)
    .add(() => {
      counter.remove();
      nav.style.clipPath = '';
      carousel.release();
    }, 4);
  revealDetails(reveal, elements, 1.5);

  const loader = gsap
    .timeline({ onUpdate: showProgress })
    .to(state, { progress: STALL_FROM, duration: 1, ease: 'expo.inOut' })
    .to(state, { progress: STALL_TO, duration: 1, ease: 'none' })
    .addPause('+=0', () => {
      void Promise.race([assets, timeout(MAX_ASSET_WAIT_MS)]).then(() => loader.resume());
    })
    .to(state, { progress: 100, duration: 1, ease: 'expo.inOut' })
    .add(() => {
      reveal.play();
    });
}

/** Arriving from another page: no loader, just the wordmark, nav strip and stack settling in. */
function playSoftEntrance(elements: IntroElements, { carousel }: HomeIntroOptions): void {
  const { home, nav, letters } = elements;
  const state = { drop: home.clientHeight * 0.6 };
  const presentStack = (): void => carousel.present(0, state.drop);

  gsap.set(letters, { yPercent: 100, rotationX: 60 });
  gsap.set(nav, { clipPath: 'inset(0 0 100% 0)' });
  hideDetails(elements);
  presentStack();

  const timeline = gsap
    .timeline({ delay: isViewTransitionActive() ? TRANSITION_DELAY : 0 })
    .to(letters, { yPercent: 0, rotationX: 0, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, 0)
    .to(
      nav,
      { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.out', clearProps: 'clipPath' },
      0,
    )
    .to(state, { drop: 0, duration: 1.4, ease: 'power3.out', onUpdate: presentStack }, 0)
    .add(() => carousel.release(), 1.4);
  revealDetails(timeline, elements, 0.3);
}

/** Sets the home page's initial animation state and plays the entrance that fits the arrival. */
export function playHomeIntro(home: HTMLElement, scope: Scope, options: HomeIntroOptions): void {
  const elements = collect(home);
  if (!elements || prefersReducedMotion()) {
    options.carousel.release();
    return;
  }

  gsap.registerPlugin(SplitText);
  const context = gsap.context(() => {
    if (options.arrival === 'fresh') playLoader(elements, options);
    else playSoftEntrance(elements, options);
  });
  scope.add(() => {
    context.revert();
  });
}
