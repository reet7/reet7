import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Texture,
} from 'three';
import type { StackMetrics } from '../components/carousel/layout';
import type { Stage, StageSource } from '../components/carousel/stage';
import { media, prefersReducedMotion } from '../core/env';
import type { Scope } from '../core/lifecycle';
import { damp } from '../core/math';
import { createFullscreenPass } from './fullscreen';
import { createPointerTrail } from './pointer-trail';
import { createRenderer } from './renderer';
import cardFragment from './shaders/card.frag.glsl?raw';
import cardVertex from './shaders/card.vert.glsl?raw';
import postFragment from './shaders/home-post.frag.glsl?raw';
import { withChunks } from './shaders';
import { imageTexture, loadImage } from './textures';

const BEND = 0.12;
const BEND_PORTRAIT = 0.14;
const EDGE_BEND_PORTRAIT = 0.1;
const LENS_AMOUNT = 0.32;
const LENS_RADIUS = 0.17;
const MSAA_SAMPLES = 4;

interface CardUniforms {
  readonly uMap: { value: Texture | null };
  readonly uPlane: { value: Vector2 };
  readonly uImage: { value: Vector2 };
  readonly uGray: { value: number };
  readonly uOpacity: { value: number };
}

interface Card {
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  readonly uniforms: CardUniforms;
}

/**
 * WebGL card stack. Cards render into a multisampled target; on mouse-driven screens a
 * post pass adds the cursor lens and dye trail. Frames are only drawn while something moves.
 * Returns `null` when WebGL is unavailable.
 */
export function createCarouselStage(
  container: HTMLElement,
  sources: readonly StageSource[],
  scope: Scope,
): Stage | null {
  let needsRender = true;
  const handle = createRenderer(container, scope, {
    antialias: true,
    onRestore: () => {
      needsRender = true;
    },
  });
  if (!handle) return null;
  const { renderer } = handle;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  const geometry = new PlaneGeometry(1, 1, 24, 24);
  const shared = {
    uWarp: { value: 0 },
    uCenterY: { value: 0 },
    uViewHeight: { value: 1 },
    uPortrait: { value: 0 },
    uBend: { value: BEND },
    uEdgeBend: { value: EDGE_BEND_PORTRAIT },
  };
  const fragmentShader = withChunks(cardFragment);
  const cards: Card[] = [];
  const textures: (Texture | null)[] = sources.map(() => null);
  const imageSizes = sources.map(() => new Vector2(3, 2));
  let hidden: number | null = null;

  const card = (index: number): Card => {
    let entry = cards[index];
    if (!entry) {
      const uniforms: CardUniforms = {
        uMap: { value: null },
        uPlane: { value: new Vector2(1, 1) },
        uImage: { value: new Vector2(1, 1) },
        uGray: { value: 0 },
        uOpacity: { value: 1 },
      };
      const material = new ShaderMaterial({
        vertexShader: cardVertex,
        fragmentShader,
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        uniforms: { ...shared, ...uniforms },
      });
      const mesh = new Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
      entry = { mesh, uniforms };
      cards[index] = entry;
    }
    return entry;
  };

  const ready = Promise.all(
    sources.map(async ({ cover }, index) => {
      const image = await loadImage(cover);
      textures[index] = imageTexture(image);
      imageSizes[index]?.set(image.naturalWidth, image.naturalHeight);
      needsRender = true;
    }),
  ).then(() => undefined);

  // Cursor effects belong to mouse-driven screens only.
  const effects = media.desktopPointer.matches && !prefersReducedMotion();
  const target = effects
    ? new WebGLRenderTarget(1, 1, { samples: MSAA_SAMPLES, depthBuffer: false })
    : null;
  const trail = effects ? createPointerTrail() : null;
  const post =
    target && trail
      ? createFullscreenPass(
          postFragment,
          {
            uScene: { value: target.texture },
            uTrail: { value: trail.texture },
            uPointer: { value: new Vector2(0.5, 0.5) },
            uAspect: { value: 1 },
            uLensRadius: { value: LENS_RADIUS },
            uLensAmount: { value: 0 },
            uTime: { value: 0 },
          },
          { transparent: false },
        )
      : null;
  const postScene = new Scene();
  if (post) postScene.add(post.mesh);

  const pointer = new Vector2(0.5, 0.5);
  const eased = new Vector2(0.5, 0.5);
  const trailPoint = new Vector2(0.5, 0.5);
  const previous = new Vector2(0.5, 0.5);
  let pointerInside = false;
  let overActive = false;
  let metrics: StackMetrics | null = null;

  if (effects) {
    scope.listen<PointerEvent>(window, 'pointermove', (event) => {
      if (!metrics) return;
      pointer.set(event.clientX / metrics.viewWidth, 1 - event.clientY / metrics.viewHeight);
      pointerInside = true;
      const dx = Math.abs(event.clientX - metrics.viewWidth / 2);
      const dy = Math.abs(event.clientY - metrics.centerY);
      overActive = dx < metrics.cardWidth / 2 && dy < metrics.cardHeight / 2;
    });
    scope.listen(document.documentElement, 'pointerleave', () => {
      overActive = false;
    });
  }

  scope.add(() => {
    geometry.dispose();
    for (const { mesh } of cards) mesh.material.dispose();
    for (const texture of textures) texture?.dispose();
    target?.dispose();
    trail?.destroy();
    post?.destroy();
  });

  const updateEffects = (delta: number, elapsed: number): boolean => {
    if (!post || !trail || !pointerInside) return false;
    const { uniforms } = post;
    previous.copy(eased);
    eased.set(damp(eased.x, pointer.x, 0.1, delta), damp(eased.y, pointer.y, 0.1, delta));
    trailPoint.set(
      damp(trailPoint.x, pointer.x, 0.3, delta),
      damp(trailPoint.y, pointer.y, 0.3, delta),
    );
    const speed = eased.distanceTo(previous);
    const moved = trailPoint.distanceTo(uniforms.uPointer.value);

    const amount = damp(uniforms.uLensAmount.value, overActive ? LENS_AMOUNT : 0, 0.08, delta);
    uniforms.uLensAmount.value = Math.min(amount, 0.6);
    uniforms.uLensRadius.value = LENS_RADIUS + speed * 1.5;
    uniforms.uPointer.value.copy(eased);
    uniforms.uTime.value = elapsed;

    const pointerMoving = speed > 0.0002 || eased.distanceTo(pointer) > 0.0005;
    if (pointerMoving || trail.isActive()) {
      trail.update(renderer, trailPoint, pointerMoving ? Math.max(moved, speed) : 0, delta);
      uniforms.uTrail.value = trail.texture;
    }
    return (
      pointerMoving || trail.isActive() || Math.abs(amount - (overActive ? LENS_AMOUNT : 0)) > 0.002
    );
  };

  return {
    ready,
    setHidden(project) {
      hidden = project;
      needsRender = true;
    },
    resize(next) {
      metrics = next;
      const { viewWidth, viewHeight } = next;
      handle.resize(viewWidth, viewHeight);
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      shared.uViewHeight.value = viewHeight;
      shared.uPortrait.value = next.portrait ? 1 : 0;
      shared.uBend.value = next.portrait ? BEND_PORTRAIT : BEND;
      const ratio = renderer.getPixelRatio();
      target?.setSize(Math.round(viewWidth * ratio), Math.round(viewHeight * ratio));
      trail?.resize(viewWidth / viewHeight);
      if (post) post.uniforms.uAspect.value = viewWidth / viewHeight;
      needsRender = true;
    },
    render({ slots, slotCount, metrics: frameMetrics, offsetY, warp, moving, delta, elapsed }) {
      if (!handle.isLive()) return;
      const effectsActive = updateEffects(delta, elapsed);
      if (!moving && !effectsActive && !needsRender) return;
      needsRender = false;

      shared.uWarp.value = prefersReducedMotion() ? 0 : warp;
      shared.uCenterY.value = frameMetrics.viewHeight / 2 - frameMetrics.centerY - offsetY;

      for (let i = 0; i < Math.max(slotCount, cards.length); i++) {
        const { mesh, uniforms } = card(i);
        const slot = i < slotCount ? slots[i] : undefined;
        const texture = slot ? textures[slot.project] : null;
        mesh.visible = Boolean(slot && texture && slot.project !== hidden);
        if (!slot || !texture) continue;

        mesh.position.set(0, frameMetrics.viewHeight / 2 - slot.centerY - offsetY, 0);
        mesh.scale.set(slot.width, slot.height, 1);
        uniforms.uPlane.value.set(slot.width, slot.height);
        uniforms.uImage.value.copy(imageSizes[slot.project] ?? uniforms.uPlane.value);
        uniforms.uMap.value = texture;
        uniforms.uGray.value = 1 - slot.activeness;
        uniforms.uOpacity.value = 0.7 + 0.3 * slot.activeness;
      }

      if (target && post) {
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(postScene, post.camera);
      } else {
        renderer.render(scene, camera);
      }
    },
  };
}
