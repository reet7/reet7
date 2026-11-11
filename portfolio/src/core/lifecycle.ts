export type Cleanup = () => void;

export interface Disposable {
  destroy(): void;
}

/** Collects teardown work so a module can release everything it acquired with one call. */
export class Scope implements Disposable {
  readonly #cleanups: Cleanup[] = [];
  #destroyed = false;

  /** Registers teardown work. On an already destroyed scope it runs immediately. */
  add(cleanup: Cleanup | Disposable): void {
    const run = typeof cleanup === 'function' ? cleanup : () => cleanup.destroy();
    if (this.#destroyed) run();
    else this.#cleanups.push(run);
  }

  listen<E extends Event = Event>(
    target: EventTarget,
    type: string,
    listener: (event: E) => void,
    options?: AddEventListenerOptions,
  ): void {
    const handler = listener as EventListener;
    target.addEventListener(type, handler, options);
    this.add(() => target.removeEventListener(type, handler, options));
  }

  destroy(): void {
    this.#destroyed = true;
    while (this.#cleanups.length > 0) this.#cleanups.pop()?.();
  }
}
