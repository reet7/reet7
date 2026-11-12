const VISITED_KEY = 'visited';
const FLIGHT_KEY = 'arrival:flight';

/**
 * How this page was reached: `fresh` on the first load of a visit, `soft` when coming from
 * another page of the site, `flight` when the home card already animated into this layout.
 */
export type Arrival = 'fresh' | 'soft' | 'flight';

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode, sandboxed frames); arrivals then always read as fresh.
  }
}

export function resolveArrival(): Arrival {
  const flight = read(FLIGHT_KEY) !== null;
  const visited = read(VISITED_KEY) !== null;
  write(FLIGHT_KEY, null);
  write(VISITED_KEY, '1');
  if (flight) return 'flight';
  return visited ? 'soft' : 'fresh';
}

/** Tells the next page that the flight animation already performed the transition. */
export function announceFlight(): void {
  write(FLIGHT_KEY, '1');
}

interface ViewTransitionEvent extends Event {
  readonly viewTransition?: { skipTransition(): void } | null;
}

/** Cancels the cross-document view transition for the navigation that is about to happen. */
export function skipNextViewTransition(): void {
  window.addEventListener(
    'pageswap',
    (event: ViewTransitionEvent) => {
      event.viewTransition?.skipTransition();
    },
    { once: true },
  );
}

/**
 * Whether this page is currently being revealed by a view transition. Reading the transition
 * exposes its promises, which reject if the browser aborts it, so those are handled here.
 */
export function isViewTransitionActive(): boolean {
  const transition = 'activeViewTransition' in document ? document.activeViewTransition : null;
  if (!transition) return false;
  transition.ready.catch(() => undefined);
  transition.finished.catch(() => undefined);
  return true;
}
