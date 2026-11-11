import {
  LinearFilter,
  Scene,
  Vector2,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three';
import type { Disposable } from '../core/lifecycle';
import { createFullscreenPass } from './fullscreen';
import fragmentShader from './shaders/trail.frag.glsl?raw';

const RESOLUTION = 320;
/** Stroke radius as a fraction of the viewport height. */
const RADIUS = 0.05;
const STRENGTH = 0.6;
/** Share of the dye that survives one second. */
const FADE_PER_SECOND = 0.2;
const QUIET_BELOW = 0.004;

export interface PointerTrail extends Disposable {
  readonly texture: Texture;
  /** True while there is visible dye left to animate. */
  isActive(): boolean;
  resize(aspect: number): void;
  /** Advances the simulation; `pointer` is in UV space, `moved` the UV distance since last frame. */
  update(renderer: WebGLRenderer, pointer: Vector2, moved: number, delta: number): void;
}

/** A low-resolution ping-pong buffer holding the fading smudge the cursor leaves behind. */
export function createPointerTrail(): PointerTrail {
  const createTarget = (): WebGLRenderTarget =>
    new WebGLRenderTarget(RESOLUTION, RESOLUTION, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: false,
    });
  let read = createTarget();
  let write = createTarget();

  const pass = createFullscreenPass(fragmentShader, {
    uPrevious: { value: read.texture },
    uTexel: { value: new Vector2(1 / RESOLUTION, 1 / RESOLUTION) },
    uFrom: { value: new Vector2(-1, -1) },
    uTo: { value: new Vector2(-1, -1) },
    uAspect: { value: 1 },
    uRadius: { value: RADIUS },
    uStrength: { value: 0 },
    uFade: { value: 1 },
  });
  const scene = new Scene();
  scene.add(pass.mesh);

  let energy = 0;
  let hasPointer = false;

  return {
    get texture() {
      return read.texture;
    },
    isActive: () => energy > QUIET_BELOW,
    resize(aspect) {
      const height = Math.max(1, Math.round(RESOLUTION / aspect));
      read.setSize(RESOLUTION, height);
      write.setSize(RESOLUTION, height);
      pass.uniforms.uTexel.value.set(1 / RESOLUTION, 1 / height);
      pass.uniforms.uAspect.value = aspect;
      energy = 0;
      hasPointer = false;
    },
    update(renderer, pointer, moved, delta) {
      const { uniforms } = pass;
      const fade = Math.pow(FADE_PER_SECOND, delta);
      const strength = hasPointer ? Math.min(moved * 12, 1) * STRENGTH : 0;
      uniforms.uFrom.value.copy(hasPointer ? uniforms.uTo.value : pointer);
      uniforms.uTo.value.copy(pointer);
      uniforms.uStrength.value = strength;
      uniforms.uFade.value = fade;
      uniforms.uPrevious.value = read.texture;
      hasPointer = true;
      energy = Math.max(energy * fade, strength);

      renderer.setRenderTarget(write);
      renderer.render(scene, pass.camera);
      renderer.setRenderTarget(null);
      [read, write] = [write, read];
    },
    destroy() {
      read.dispose();
      write.dispose();
      pass.destroy();
    },
  };
}
