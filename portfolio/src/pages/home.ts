import { gsap } from 'gsap';
import { disposer, qs, qsa, reducedMotion } from '../core/env';
import { haptic } from '../core/haptics';
import { navigate, onLeave } from '../core/transitions';
import { initCursor } from '../components/cursor';
import { playHomeIntro } from '../components/intro';
import { initProjectList } from '../components/project-list';

interface ProjectInfo {
  slug: string;
  name: string;
  category: string;
  tags: string[];
}

// Open-project motion from the reference: 1.9s fly with a soft-start, hard-stop curve; background dims to 0.6 and blurs 10px.
const FLY = 1.9;
const FLY_EASE = 'cubic-bezier(0.65, 0.05, 0, 1)';

function swapText(el: HTMLElement | null, text: string): void {
  if (!el || el.textContent === text) return;
  if (reducedMotion() || !el.isConnected) {
    el.textContent = text;
    return;
  }
  gsap.timeline()
    .to(el, { yPercent: -60, opacity: 0, duration: 0.25, ease: 'power3.in' })
    .add(() => {
      el.textContent = text;
    })
    .fromTo(el, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
}

export function initHome(): { destroy(): void } {
  const d = disposer();
  const data = JSON.parse(qs('#projects-data')?.textContent ?? '[]') as ProjectInfo[];
  const num = qs('[data-row-num]');
  const tags = qs('[data-row-tags]');
  const cat = qs('[data-row-cat]');
  const names = qsa<HTMLButtonElement>('[data-name]');
  const home = qs('[data-home]')!;
  const line = qs('[data-work-line]');

  const list = initProjectList((i) => {
    const p = data[i];
    swapText(num, String(i + 1));
    swapText(tags, p.tags.join(', '));
    swapText(cat, p.category);
    names.forEach((b, j) => b.setAttribute('aria-current', String(i === j)));
  });
  d.add(list.destroy);

  const placeLine = (): void => home.style.setProperty('--line-y', `${list.lineY()}px`);
  placeLine();
  d.on(window, 'resize', placeLine);

  names.forEach((b) =>
    d.on(b, 'click', () => {
      haptic();
      list.goTo(Number(b.dataset.index));
    }),
  );

  const cursor = initCursor();
  d.add(cursor.destroy);
  list.cards.forEach((card, i) => {
    const link = qs<HTMLAnchorElement>('[data-card-link]', card)!;
    d.on(link, 'pointerenter', () => cursor.show(list.active() === i ? 'Open' : 'View'));
    d.on(link, 'pointerleave', () => cursor.hide());
    d.on(link, 'click', ((e: MouseEvent) => {
      if (list.active() === i) return;
      e.preventDefault();
      e.stopPropagation();
      haptic();
      list.goTo(i);
      cursor.show('Open');
    }) as EventListener);
    d.on(link, 'focus', () => {
      if (list.active() !== i) list.goTo(i);
    });
  });

  d.add(
    onLeave((link) => {
      const card = link.closest<HTMLElement>('[data-card]');
      if (!card) return null;
      list.enable(false);
      cursor.hide();
      const r = card.getBoundingClientRect();
      const m = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const mobile = innerWidth < 768;
      const w = mobile ? innerWidth - 2 * m : (innerWidth - 3 * m) / 2;
      const target = { left: mobile ? m : innerWidth / 2 + m / 2, top: mobile ? innerHeight * 0.35 : m, width: w, height: w / 1.5 };
      const clone = card.cloneNode(true) as HTMLElement;
      clone.classList.add('card-fly', 'is-active');
      Object.assign(clone.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, transform: 'none', zIndex: '80', margin: '0' });
      document.body.append(clone);
      card.style.visibility = 'hidden';
      const others = [qs('.top'), qs('[data-stage]'), qs('[data-row]'), qs('.intro-text'), qs('.home .foot'), line];
      return new Promise<void>((resolve) => {
        sessionStorage.setItem('fly-in', link.pathname);
        gsap.timeline({ onComplete: resolve })
          .to(others, { opacity: 0.4, filter: 'blur(10px)', duration: 1.2, ease: 'power2.out' }, 0)
          .to(clone, { ...Object.fromEntries(Object.entries(target).map(([k, v]) => [k, `${v}px`])), duration: reducedMotion() ? 0 : FLY, ease: FLY_EASE }, 0)
          .to({}, { duration: 0.05 });
      });
    }),
  );

  playHomeIntro(list).then(() => list.enable(true));

  d.on(home, 'keydown', ((e: KeyboardEvent) => {
    if (e.key !== 'Enter' || (e.target as Element).closest('a, button')) return;
    const link = qs<HTMLAnchorElement>('[data-card-link]', list.cards[list.active()]);
    if (link) navigate(link);
  }) as EventListener);

  return { destroy: d.run };
}
