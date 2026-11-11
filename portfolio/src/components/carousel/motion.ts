import { damp, smoothDamp, wrap, type SpringState } from '../../core/math';

const SETTLE_TIME = 0.42;
const DRAG_TIME = 0.16;
const WHEEL_DISTANCE = 1.6;
const WHEEL_IDLE_MS = 140;
/** A wheel gesture that moved at least this far always advances one card. */
const WHEEL_COMMIT = 0.12;
/** Pixels a release at 1px/ms carries the stack. */
const FLICK_DISTANCE = 260;
const REST_EPSILON = 0.0005;

/**
 * Position of the carousel in steps. Wheel, drag and keys move a target; the position
 * follows it on a critically damped spring and always comes to rest on an integer.
 */
export class CarouselMotion {
  readonly #spring: SpringState = { value: 0, velocity: 0 };
  #target = 0;
  #smoothTime = SETTLE_TIME;
  #wheelOrigin = 0;
  #wheelDistance = 0;
  #wheelTimer = 0;
  #dragOrigin: number | null = null;
  #dragVelocity = 0;
  #warpVelocity = 0;
  #warp = 0;

  constructor(readonly count: number) {}

  get position(): number {
    return this.#spring.value;
  }

  /** Bend amount for the card shader, derived from low-passed velocity. */
  get warp(): number {
    return this.#warp;
  }

  get isResting(): boolean {
    return (
      this.#dragOrigin === null &&
      Math.abs(this.#target - this.#spring.value) < REST_EPSILON &&
      Math.abs(this.#spring.velocity) < REST_EPSILON &&
      Math.abs(this.#warp) < REST_EPSILON
    );
  }

  /** Index of the project the carousel is heading to. */
  get targetIndex(): number {
    return wrap(Math.round(this.#target), this.count);
  }

  /** Index of the project nearest the centre right now. */
  get index(): number {
    return wrap(Math.round(this.#spring.value), this.count);
  }

  /** Places the carousel without animation; used by the intro and reduced-motion mode. */
  jump(position: number): void {
    this.#spring.value = position;
    this.#spring.velocity = 0;
    this.#target = position;
  }

  step(direction: 1 | -1): void {
    this.#settleTo(Math.round(this.#target) + direction, SETTLE_TIME);
  }

  /** Travels to a project along the shorter way round, taking longer for longer trips. */
  goTo(index: number): void {
    const from = Math.round(this.#target);
    let distance = wrap(index - from, this.count);
    if (distance > this.count / 2) distance -= this.count;
    this.#settleTo(from + distance, Math.min(0.8, 0.34 + 0.08 * Math.abs(distance)));
  }

  wheel(deltaPixels: number, stepPixels: number): void {
    if (this.#wheelTimer === 0) {
      this.#wheelOrigin = Math.round(this.#target);
      this.#wheelDistance = 0;
    }
    window.clearTimeout(this.#wheelTimer);
    this.#wheelDistance += deltaPixels / (stepPixels * WHEEL_DISTANCE);
    this.#target = this.#wheelOrigin + this.#wheelDistance;
    this.#smoothTime = SETTLE_TIME;
    this.#wheelTimer = window.setTimeout(() => {
      this.#wheelTimer = 0;
      let rest = Math.round(this.#target);
      if (rest === this.#wheelOrigin && Math.abs(this.#wheelDistance) > WHEEL_COMMIT) {
        rest += Math.sign(this.#wheelDistance);
      }
      this.#settleTo(rest, SETTLE_TIME);
    }, WHEEL_IDLE_MS);
  }

  dragStart(): void {
    this.#cancelWheel();
    this.#dragOrigin = this.#target;
    this.#dragVelocity = 0;
    this.#smoothTime = DRAG_TIME;
  }

  /** `offsetSteps` is the total drag distance; `velocity` the pointer speed in steps per millisecond. */
  dragMove(offsetSteps: number, velocity: number): void {
    if (this.#dragOrigin === null) return;
    this.#target = this.#dragOrigin + offsetSteps;
    this.#dragVelocity = velocity;
  }

  dragEnd(): void {
    if (this.#dragOrigin === null) return;
    this.#dragOrigin = null;
    this.#settleTo(Math.round(this.#target + this.#dragVelocity * FLICK_DISTANCE), SETTLE_TIME);
  }

  /** Advances the spring; `instant` skips the easing for reduced-motion visitors. */
  update(delta: number, instant = false): void {
    if (instant) {
      this.jump(this.#dragOrigin === null ? Math.round(this.#target) : this.#target);
      this.#warpVelocity = 0;
      this.#warp = 0;
      return;
    }
    const before = this.#spring.value;
    smoothDamp(this.#spring, this.#target, this.#smoothTime, delta);

    const perFrame = (this.#spring.value - before) / (delta * 60 || 1);
    this.#warpVelocity = damp(this.#warpVelocity, perFrame, 0.16, delta);
    const drive = Math.max(-1.5, Math.min(1.5, this.#warpVelocity * 30));
    const shaped = Math.sign(drive) * Math.pow(Math.abs(drive), 1.85) * 0.46;
    this.#warp = damp(this.#warp, shaped, 0.07, delta);
  }

  destroy(): void {
    this.#cancelWheel();
  }

  #settleTo(target: number, smoothTime: number): void {
    this.#cancelWheel();
    this.#target = target;
    this.#smoothTime = smoothTime;
  }

  #cancelWheel(): void {
    window.clearTimeout(this.#wheelTimer);
    this.#wheelTimer = 0;
  }
}
