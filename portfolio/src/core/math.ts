export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Positive modulo: wraps any integer or float into [0, length). */
export const wrap = (value: number, length: number): number => ((value % length) + length) % length;

/** Frame-rate independent replacement for `current += (target - current) * factor` tuned at 60fps. */
export function damp(current: number, target: number, factor: number, delta: number): number {
  return lerp(current, target, 1 - Math.pow(1 - factor, delta * 60));
}

export interface SpringState {
  value: number;
  velocity: number;
}

/** Critically damped spring step; `smoothTime` is roughly the time to reach the target. */
export function smoothDamp(
  state: SpringState,
  target: number,
  smoothTime: number,
  delta: number,
): void {
  const omega = 2 / Math.max(0.0001, smoothTime);
  const x = omega * delta;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = state.value - target;
  const temp = (state.velocity + omega * change) * delta;
  state.velocity = (state.velocity - omega * temp) * decay;
  state.value = target + (change + temp) * decay;
}
