import {
  CanvasTexture,
  Color,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderTarget,
} from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { media } from '../core/env';
import { tick } from '../core/feedback';
import type { Scope } from '../core/lifecycle';
import { clamp, wrap } from '../core/math';
import { onFrame } from '../core/ticker';
import { onResize } from '../core/viewport';
import { createFullscreenPass } from './fullscreen';
import { createRenderer } from './renderer';
import fragmentShader from './shaders/barrel.frag.glsl?raw';

const BACKGROUND = '#0e0e0e';
const FONT = '500 100px "Inter Tight", Arial, sans-serif';
/** Cap height plus leading, in ems: the vertical pitch of the labels. */
const LINE_HEIGHT = 0.86;
/** How many times the full list passes the centre while the section crosses the viewport. */
const TURNS = 1.5;
const DISTORTION = -0.9;
const DISTORTION_PORTRAIT = -0.75;
const DISTORTION_QUARTIC = -0.6;

interface Label {
  readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  /** Width over height of the label texture. */
  readonly aspect: number;
}

function fontSize(width: number, height: number): number {
  if (width < 768) return width * 0.12;
  if (width < height) return width * 0.085;
  return Math.min(width * 0.09, height * 0.13);
}

/** Draws one uppercase label into a texture sized to its text. */
function createLabel(text: string, geometry: PlaneGeometry): Label {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const size = 100 * Math.min(window.devicePixelRatio, 2);
  const font = FONT.replace('100px', `${size}px`);
  const content = text.toUpperCase();
  let width = size;
  if (context) {
    context.font = font;
    context.letterSpacing = `${-0.05 * size}px`;
    width = Math.ceil(context.measureText(content).width + size * 0.2);
    canvas.width = width;
    canvas.height = Math.ceil(size * 1.2);
    context.font = font;
    context.letterSpacing = `${-0.05 * size}px`;
    context.fillStyle = '#fff';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(content, width / 2, canvas.height / 2 + size * 0.04);
  }
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthTest: false });
  return { mesh: new Mesh(geometry, material), aspect: width / (size * 1.2) };
}

/**
 * The services drum: labels scroll endlessly up a barrel-distorted surface, scrubbed by the
 * section's progress through the viewport. Returns false when WebGL is unavailable, in which
 * case the plain list in the markup stays visible.
 */
export function createDrum(section: HTMLElement, scope: Scope): boolean {
  const container = section.querySelector<HTMLElement>('[data-drum-stage]');
  const names = [...section.querySelectorAll('[data-drum-list] li')].map(
    (item) => item.textContent,
  );
  if (!container || names.length === 0) return false;

  let dirty = true;
  const handle = createRenderer(container, scope, {
    alpha: false,
    onRestore: () => {
      dirty = true;
    },
  });
  if (!handle) return false;
  const { renderer } = handle;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const geometry = new PlaneGeometry(1, 1);
  const target = new WebGLRenderTarget(1, 1, { depthBuffer: false });
  const pass = createFullscreenPass(fragmentShader, {
    uMap: { value: target.texture },
    uBackground: { value: new Color(BACKGROUND) },
    uDistortion: { value: DISTORTION },
    uDistortion2: { value: DISTORTION_QUARTIC },
    uEdgeFade: { value: 0.18 },
  });
  const passScene = new Scene();
  passScene.add(pass.mesh);

  let sources: Label[] = [];
  let labels: Label[] = [];
  let pitch = 1;
  let height = 1;
  let progress = 0;
  let centered = -1;

  /** Repeats the list until it overfills the stage, so the loop never shows a gap. */
  const build = (): void => {
    if (sources.length === 0) return;
    const width = container.clientWidth;
    height = container.clientHeight;
    const size = fontSize(width, height);
    pitch = size * LINE_HEIGHT;
    const copies = Math.ceil((height + pitch * 2) / (sources.length * pitch)) + 1;

    for (const { mesh } of labels) scene.remove(mesh);
    labels = Array.from({ length: copies * sources.length }, (_, index) => {
      const source = sources[index % sources.length];
      if (!source) throw new Error('Drum label missing');
      const mesh = index < sources.length ? source.mesh : source.mesh.clone();
      if (mesh !== source.mesh) mesh.material = source.mesh.material.clone();
      mesh.scale.set(size * 1.2 * source.aspect, size * 1.2, 1);
      scene.add(mesh);
      return { mesh, aspect: source.aspect };
    });

    handle.resize(width, height);
    const ratio = renderer.getPixelRatio();
    target.setSize(Math.round(width * ratio), Math.round(height * ratio));
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    pass.uniforms.uDistortion.value = media.portraitStack.matches
      ? DISTORTION_PORTRAIT
      : DISTORTION;
    dirty = true;
  };

  const render = (): void => {
    if (!dirty || !handle.isLive() || labels.length === 0) return;
    dirty = false;
    const loop = labels.length * pitch;
    const travel = progress * sources.length * pitch * TURNS;
    let nearest = Infinity;
    let nearestIndex = 0;

    labels.forEach(({ mesh }, index) => {
      const y = wrap(travel - index * pitch + loop / 2, loop) - loop / 2;
      const closeness = clamp(1 - Math.abs(y) / (3 * pitch), 0, 1);
      mesh.position.y = y;
      mesh.material.opacity = 0.1 + 0.9 * closeness ** 3;
      mesh.visible = Math.abs(y) < height / 2 + pitch;
      if (Math.abs(y) < nearest) {
        nearest = Math.abs(y);
        nearestIndex = index % sources.length;
      }
    });
    if (nearestIndex !== centered) {
      if (centered !== -1) tick(nearestIndex);
      centered = nearestIndex;
    }

    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(passScene, pass.camera);
  };

  gsap.registerPlugin(ScrollTrigger);
  const state = { progress: 0 };
  const tween = gsap.to(state, {
    progress: 1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
    onUpdate: () => {
      progress = state.progress;
      dirty = true;
    },
  });

  // Labels are rasterised from the web font, so they are only drawn once it is available.
  void document.fonts.load(FONT).finally(() => {
    sources = names.map((name) => createLabel(name, geometry));
    build();
    section.classList.add('is-live');
  });
  scope.add(onResize(build));
  scope.add(onFrame(render));
  scope.add(() => {
    tween.scrollTrigger?.kill();
    tween.kill();
    geometry.dispose();
    target.dispose();
    pass.destroy();
    for (const { mesh } of [...labels, ...sources]) {
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
  });

  return true;
}
