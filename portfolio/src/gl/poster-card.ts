import {
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  type Texture,
} from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { media } from '../core/env';
import type { Scope } from '../core/lifecycle';
import { clamp, damp, smoothstep } from '../core/math';
import type { ScrollController } from '../core/scroll';
import { onFrame } from '../core/ticker';
import { getViewport, onResize } from '../core/viewport';
import { createPosterTexture } from './poster-texture';
import { createRenderer } from './renderer';
import fragmentShader from './shaders/poster.frag.glsl?raw';
import vertexShader from './shaders/poster.vert.glsl?raw';
import { withChunks } from './shaders';

const CAMERA_DISTANCE = 1500;
const SEGMENTS = 32;
const TEXTURE_WIDTH = 720;
const REVEAL_SECONDS = 2;
const REVEAL_DELAY = 0.1;
/** Scroll speed (px/s) that bends the sheet fully. */
const BEND_VELOCITY = 2000;
const BEND_STRENGTH = 0.9 * 1.3;
/** The burn runs while the services section rises through this band of the viewport. */
const BURN_FROM = 0.85;
const BURN_TO = 0.3;
const TOUCH_SHRINK = 0.11;

export interface PosterCardElements {
  /** The DOM poster; it supplies position, size and artwork, and is hidden once the card is live. */
  readonly poster: HTMLElement;
  /** The section whose arrival burns the card away. */
  readonly burnAt: HTMLElement;
}

interface Layout {
  width: number;
  height: number;
  centerX: number;
  /** Document-space Y of the poster's centre. */
  startY: number;
  burnTop: number;
  viewWidth: number;
  viewHeight: number;
}

/**
 * The poster as a sheet of paper in WebGL. It rises with the page until it reaches the centre
 * of the screen, stays there while flipping from front to back, bends and flutters with scroll
 * velocity, and burns away when the services section arrives.
 * Returns false when WebGL is unavailable; the DOM poster then stays as it is.
 */
export function createPosterCard(
  { poster, burnAt }: PosterCardElements,
  scope: Scope,
  scroll: ScrollController,
): boolean {
  const front = poster.querySelector<HTMLElement>('[data-poster-face="front"]');
  const back = poster.querySelector<HTMLElement>('[data-poster-face="back"]');
  if (!front || !back) return false;

  const container = document.createElement('div');
  container.className = 'poster-stage';
  document.body.append(container);
  scope.add(() => {
    container.remove();
  });

  let dirty = true;
  const handle = createRenderer(container, scope, {
    antialias: true,
    onRestore: () => {
      dirty = true;
    },
  });
  if (!handle) return false;
  const { renderer } = handle;

  const camera = new PerspectiveCamera(45, 1, 10, CAMERA_DISTANCE * 3);
  camera.position.z = CAMERA_DISTANCE;
  const uniforms = {
    uFront: { value: null as Texture | null },
    uBack: { value: null as Texture | null },
    uSize: { value: new Vector2(1, 1) },
    uBend: { value: 0 },
    uFlutter: { value: 0 },
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uBurn: { value: 0 },
  };
  const geometry = new PlaneGeometry(1, 1, SEGMENTS, SEGMENTS);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader: withChunks(fragmentShader),
    uniforms,
    side: DoubleSide,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
  });
  const mesh = new Mesh(geometry, material);
  const scene = new Scene();
  scene.add(mesh);

  const layout: Layout = {
    width: 1,
    height: 1,
    centerX: 0,
    startY: 0,
    burnTop: 0,
    viewWidth: 1,
    viewHeight: 1,
  };

  const measure = (): void => {
    const { width: viewWidth, height: viewHeight } = getViewport();
    const position = scroll.position();
    const rect = poster.getBoundingClientRect();
    layout.width = rect.width;
    layout.height = rect.height;
    layout.centerX = rect.left + rect.width / 2;
    layout.startY = rect.top + rect.height / 2 + position;
    layout.burnTop = burnAt.getBoundingClientRect().top + position;
    layout.viewWidth = viewWidth;
    layout.viewHeight = viewHeight;

    handle.resize(viewWidth, viewHeight);
    camera.aspect = viewWidth / viewHeight;
    camera.fov = (2 * Math.atan(viewHeight / 2 / CAMERA_DISTANCE) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    uniforms.uSize.value.set(rect.width, rect.height);
    dirty = true;
  };

  let live = false;
  let revealTime = -REVEAL_DELAY;
  let lastPosition = scroll.position();
  let velocity = 0;
  let cleared = false;

  const frame = (delta: number, elapsed: number): void => {
    if (!live || !handle.isLive()) return;
    const position = scroll.position();
    velocity = damp(velocity, (position - lastPosition) / delta, 0.18, delta);
    lastPosition = position;

    const { viewHeight } = layout;
    const burnStart = layout.burnTop - viewHeight * BURN_FROM;
    const burnEnd = layout.burnTop - viewHeight * BURN_TO;
    const burn = clamp((position - burnStart) / (burnEnd - burnStart), 0, 1);
    if (burn >= 1) {
      if (!cleared) renderer.clear();
      cleared = true;
      return;
    }

    const bendTarget = clamp(-velocity / BEND_VELOCITY, -1, 1) * BEND_STRENGTH;
    const bend = damp(uniforms.uBend.value, bendTarget, 0.09, delta);
    const flutter = damp(
      uniforms.uFlutter.value,
      Math.min(1, Math.abs(velocity) / 1200),
      0.09,
      delta,
    );
    const revealing = revealTime < REVEAL_SECONDS;
    const moving = Math.abs(velocity) > 0.5 || Math.abs(bend) > 0.001 || flutter > 0.001;
    if (!moving && !revealing && !dirty && !cleared) return;
    dirty = false;
    cleared = false;

    revealTime = Math.min(REVEAL_SECONDS, revealTime + delta);
    const reveal = clamp(revealTime / REVEAL_SECONDS, 0, 1);
    uniforms.uReveal.value = 1 - (1 - reveal) ** 3;
    uniforms.uBurn.value = burn;
    uniforms.uBend.value = bend;
    uniforms.uFlutter.value = flutter;
    uniforms.uTime.value = elapsed;

    // Rise with the page, then hold at the centre of the screen.
    const centerY = Math.max(layout.startY - position, viewHeight / 2);
    const turn = smoothstep(0, 1, clamp(position / Math.max(1, burnStart), 0, 1));
    const shrink = media.touch.matches
      ? 1 - TOUCH_SHRINK * clamp(position / (viewHeight / 2), 0, 1)
      : 1;

    mesh.position.set(layout.centerX - layout.viewWidth / 2, viewHeight / 2 - centerY, 0);
    mesh.scale.set(layout.width * shrink, layout.height * shrink, layout.width * shrink);
    mesh.rotation.set(
      -Math.sin(Math.PI * turn) * 0.15,
      Math.PI * turn,
      Math.sin(Math.PI * turn) * 0.06,
    );
    renderer.render(scene, camera);
  };

  // Faces are rasterised from the web font, so wait for it before drawing them.
  const start = async (): Promise<void> => {
    await document.fonts.load('500 16px "Inter Tight"');
    const [frontTexture, backTexture] = await Promise.all([
      createPosterTexture(front, TEXTURE_WIDTH),
      createPosterTexture(back, TEXTURE_WIDTH),
    ]);
    uniforms.uFront.value = frontTexture;
    uniforms.uBack.value = backTexture;
    scope.add(() => {
      frontTexture.dispose();
      backTexture.dispose();
    });
    measure();
    poster.classList.add('is-live');
    live = true;
  };
  void start().catch(() => {
    container.remove();
  });

  ScrollTrigger.addEventListener('refresh', measure);
  scope.add(() => {
    ScrollTrigger.removeEventListener('refresh', measure);
  });
  scope.add(onResize(measure));
  scope.add(onFrame(frame));
  scope.add(() => {
    geometry.dispose();
    material.dispose();
    poster.classList.remove('is-live');
  });
  return true;
}
