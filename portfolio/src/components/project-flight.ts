import '../styles/work.css';
import '../styles/flight.css';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import { Scope } from '../core/lifecycle';
import { announceFlight, skipNextViewTransition } from '../core/transitions';
import { createFlightPlane, type Rect } from '../gl/flight-plane';
import { loadImage } from '../gl/textures';

const FLY_DURATION = 1.9;
/** Fast out of the gate, then a long glide into place. */
const FLY_EASE =
  'M0,0 C0.094,0.026 0.124,0.127 0.157,0.29 0.197,0.486 0.254,0.8 0.348,0.884 0.42,0.949 0.374,1 1,1';
/** The page content starts to arrive this far into the flight. */
const REVEAL_AT = 0.25 * FLY_DURATION;

export interface FlightOptions {
  readonly link: HTMLAnchorElement;
  readonly cover: string;
  readonly from: Rect;
  /** Called on the frame the flying image takes over from the carousel card. */
  readonly onTakeoff: () => void;
  /** Called if the visitor returns to this page from the back-forward cache. */
  readonly onReturn: () => void;
}

/** Fetches the case page and extracts the parts staged in the overlay, with URLs made absolute. */
async function fetchPage(url: string): Promise<DocumentFragment> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
  const fragment = document.createDocumentFragment();
  for (const part of parsed.querySelectorAll('.page-top, .case')) {
    fragment.append(document.importNode(part, true));
  }
  for (const image of fragment.querySelectorAll('img')) {
    image.src = new URL(image.getAttribute('src') ?? '', url).href;
    image.removeAttribute('srcset');
    image.removeAttribute('loading');
  }
  for (const element of fragment.querySelectorAll('[id]')) element.removeAttribute('id');
  return fragment;
}

function buildOverlay(page: DocumentFragment): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'flight';
  overlay.inert = true;
  const backdrop = document.createElement('div');
  backdrop.className = 'flight__backdrop';
  const stage = document.createElement('div');
  stage.className = 'flight__page';
  stage.append(page);
  overlay.append(backdrop, stage);
  return overlay;
}

function revealPage(timeline: gsap.core.Timeline, overlay: HTMLElement): void {
  const nav = overlay.querySelector('.nav');
  const texts = [...overlay.querySelectorAll<HTMLElement>('[data-reveal="lines"]')];
  const fades = overlay.querySelectorAll('[data-reveal="fade"], .scroll-hint');
  const media = overlay.querySelectorAll('[data-reveal="media"]:not([data-cover])');

  timeline
    .from(nav, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.out' }, REVEAL_AT)
    .from(
      media,
      { y: window.innerHeight * 0.6, duration: 1.6, ease: 'expo.out', stagger: 0.1 },
      REVEAL_AT,
    )
    .from(fades, { opacity: 0, duration: 0.8, ease: 'power2.out' }, REVEAL_AT + 0.2);
  texts.forEach((text, index) => {
    const split = SplitText.create(text, { type: 'lines', mask: 'lines' });
    timeline.from(
      split.lines,
      { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.06 },
      REVEAL_AT + index * 0.08,
    );
  });
}

/**
 * Carries the clicked carousel card to the cover slot of its case page, then performs the
 * real navigation. By then both pages look identical, so the swap is invisible.
 * Rejects without side effects if the page cannot be staged; callers then navigate plainly.
 */
export async function flyToProject(options: FlightOptions): Promise<void> {
  const { link, cover, from } = options;
  const [page, image] = await Promise.all([fetchPage(link.href), loadImage(cover)]);

  const scope = new Scope();
  const overlay = buildOverlay(page);
  document.body.append(overlay);
  scope.add(() => {
    overlay.remove();
  });

  const slot = overlay.querySelector<HTMLElement>('[data-cover]');
  const plane = slot
    ? createFlightPlane(overlay, scope, image, from, slot.getBoundingClientRect())
    : null;
  if (!slot || !plane) {
    scope.destroy();
    throw new Error('Flight could not be staged');
  }

  gsap.registerPlugin(CustomEase, SplitText);
  const state = { progress: 0 };
  const timeline = gsap.timeline({
    onComplete: () => {
      announceFlight();
      skipNextViewTransition();
      window.location.assign(link.href);
    },
  });
  scope.add(() => {
    timeline.kill();
  });

  slot.style.visibility = 'hidden';
  plane.render(0);
  options.onTakeoff();
  // Reading layout commits the closed state so the backdrop transition runs.
  overlay.getBoundingClientRect();
  overlay.classList.add('is-open');

  timeline.to(state, {
    progress: 1,
    duration: FLY_DURATION,
    ease: CustomEase.create('flight', FLY_EASE),
    onUpdate: () => plane.render(state.progress),
  });
  revealPage(timeline, overlay);

  window.addEventListener(
    'pageshow',
    (event) => {
      if (!event.persisted) return;
      scope.destroy();
      options.onReturn();
    },
    { once: true },
  );
}
