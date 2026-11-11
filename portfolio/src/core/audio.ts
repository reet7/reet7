import type { Scope } from './lifecycle';

const VOLUME = 0.3;
const MIN_INTERVAL_MS = 45;
const BASE_FREQUENCY = 110;
/** Each step of the six-note cycle is this much higher than the last. */
const STEP_RATIO = 1.07;
const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'click'] as const;

let context: AudioContext | null = null;
let lastTick = 0;

function unlock(): void {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
}

/** Browsers only start audio after a user gesture, so the context is created on the first one. */
export function initAudio(scope: Scope): void {
  if (typeof AudioContext === 'undefined') return;
  for (const type of UNLOCK_EVENTS) scope.listen(window, type, unlock, { passive: true });
  scope.add(() => {
    void context?.close();
    context = null;
  });
}

function playTone(audio: AudioContext, pitch: number, at: number): void {
  const oscillator = audio.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(BASE_FREQUENCY * pitch * 1.7, at);
  oscillator.frequency.exponentialRampToValueAtTime(BASE_FREQUENCY * pitch, at + 0.03);

  const lowpass = audio.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 900;
  lowpass.Q.value = 0.5;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(VOLUME, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.09);

  oscillator.connect(lowpass).connect(gain).connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + 0.1);
}

function playNoise(audio: AudioContext, pitch: number, at: number): void {
  const length = Math.round(audio.sampleRate * 0.02);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / length);

  const source = audio.createBufferSource();
  source.buffer = buffer;

  const bandpass = audio.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 500 * pitch;
  bandpass.Q.value = 0.8;

  const gain = audio.createGain();
  gain.gain.value = 0.25 * VOLUME;

  source.connect(bandpass).connect(gain).connect(audio.destination);
  source.start(at);
  source.stop(at + 0.025);
}

/** A short synthesised tick: a falling sine blip plus a burst of filtered noise. */
export function playTick(step: number): void {
  const now = performance.now();
  if (context?.state !== 'running' || now - lastTick < MIN_INTERVAL_MS) return;
  lastTick = now;
  const pitch = Math.pow(STEP_RATIO, ((step % 6) + 6) % 6);
  playTone(context, pitch, context.currentTime);
  playNoise(context, pitch, context.currentTime);
}
