import { LinearFilter, Scene, Vector2, WebGLRenderTarget } from 'three';
import type { Scope } from '../core/lifecycle';
import { clamp, damp } from '../core/math';
import type { ScrollController } from '../core/scroll';
import { onFrame } from '../core/ticker';
import { onResize } from '../core/viewport';
import { createFullscreenPass } from './fullscreen';
import { createRenderer } from './renderer';
import blurFragment from './shaders/blur.frag.glsl?raw';
import compositeFragment from './shaders/hero-composite.frag.glsl?raw';
import sceneFragment from './shaders/hero-scene.frag.glsl?raw';
import { withChunks } from './shaders';

const ABERRATION = -0.24;
const VIGNETTE = 0.25;
const INTRO_SECONDS = 3;
const MAX_PIXEL_RATIO = 1.5;
const MIN_PIXEL_RATIO = 0.5;
/** Frames slower than this lower the resolution one step. */
const SLOW_FRAME_SECONDS = 0.045;
const BLUR_SCALE = 0.25;

/**
 * About hero backdrop: a procedural landscape of rock silhouettes, drifting smoke and god
 * rays, finished with a blur, spectral chromatic aberration, vignette and grain. It follows
 * the pointer and scroll, lowers its resolution on slow devices, and stops rendering once
 * the hero has scrolled away. Returns false when WebGL is unavailable.
 */
export function createHeroScene(
  container: HTMLElement,
  scope: Scope,
  scroll: ScrollController,
): boolean {
  const handle = createRenderer(container, scope, { alpha: false });
  if (!handle) return false;
  const { renderer } = handle;

  const targetOptions = { minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false };
  const sceneTarget = new WebGLRenderTarget(1, 1, targetOptions);
  const blurTargetA = new WebGLRenderTarget(1, 1, targetOptions);
  const blurTargetB = new WebGLRenderTarget(1, 1, targetOptions);

  const scenePass = createFullscreenPass(withChunks(sceneFragment), {
    uResolution: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uPointer: { value: new Vector2(0, 0) },
    uScroll: { value: 0 },
    uIntro: { value: 0 },
  });
  const blurPass = createFullscreenPass(blurFragment, {
    uMap: { value: sceneTarget.texture },
    uStep: { value: new Vector2(0, 0) },
  });
  const compositePass = createFullscreenPass(withChunks(compositeFragment), {
    uScene: { value: sceneTarget.texture },
    uBlur: { value: blurTargetB.texture },
    uAberration: { value: ABERRATION },
    uVignette: { value: VIGNETTE },
    uTime: { value: 0 },
  });
  const passes = [scenePass, blurPass, compositePass];
  const scenes = passes.map((pass) => new Scene().add(pass.mesh));
  const draw = (index: number, target: WebGLRenderTarget | null): void => {
    const scene = scenes[index];
    if (!scene) return;
    renderer.setRenderTarget(target);
    renderer.render(scene, scenePass.camera);
  };

  let pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
  let width = 1;
  let height = 1;
  const resize = (): void => {
    width = container.clientWidth;
    height = container.clientHeight;
    handle.resize(width, height, pixelRatio);
    const w = Math.round(width * pixelRatio);
    const h = Math.round(height * pixelRatio);
    sceneTarget.setSize(w, h);
    blurTargetA.setSize(Math.round(w * BLUR_SCALE), Math.round(h * BLUR_SCALE));
    blurTargetB.setSize(Math.round(w * BLUR_SCALE), Math.round(h * BLUR_SCALE));
    scenePass.uniforms.uResolution.value.set(w, h);
  };

  const pointer = new Vector2(0, 0);
  scope.listen<PointerEvent>(window, 'pointermove', (event) => {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      1 - (event.clientY / window.innerHeight) * 2,
    );
  });

  let time = 0;
  let slowFrames = 0;
  const frame = (delta: number): void => {
    const progress = scroll.position() / Math.max(1, height);
    if (progress >= 1 || !handle.isLive()) return;

    time += delta;
    const { uniforms } = scenePass;
    uniforms.uTime.value = time;
    uniforms.uScroll.value = clamp(progress, 0, 1);
    uniforms.uIntro.value = 1 - Math.pow(2, (-10 * Math.min(time, INTRO_SECONDS)) / INTRO_SECONDS);
    uniforms.uPointer.value.set(
      damp(uniforms.uPointer.value.x, pointer.x, 0.05, delta),
      damp(uniforms.uPointer.value.y, pointer.y, 0.05, delta),
    );
    compositePass.uniforms.uTime.value = time;

    draw(0, sceneTarget);
    blurPass.uniforms.uMap.value = sceneTarget.texture;
    blurPass.uniforms.uStep.value.set(1 / blurTargetA.width, 0);
    draw(1, blurTargetA);
    blurPass.uniforms.uMap.value = blurTargetA.texture;
    blurPass.uniforms.uStep.value.set(0, 1 / blurTargetA.height);
    draw(1, blurTargetB);
    draw(2, null);

    // Persistently slow frames trade resolution for frame rate.
    slowFrames = delta > SLOW_FRAME_SECONDS ? slowFrames + 1 : 0;
    if (slowFrames > 20 && pixelRatio > MIN_PIXEL_RATIO) {
      pixelRatio = Math.max(MIN_PIXEL_RATIO, pixelRatio - 0.25);
      slowFrames = 0;
      resize();
    }
  };

  resize();
  scope.add(onResize(resize));
  scope.add(onFrame(frame));
  scope.add(() => {
    sceneTarget.dispose();
    blurTargetA.dispose();
    blurTargetB.dispose();
    for (const pass of passes) pass.destroy();
  });
  container.classList.add('is-live');
  return true;
}
