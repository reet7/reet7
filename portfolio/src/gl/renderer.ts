import { WebGLRenderer } from 'three';
import type { Scope } from '../core/lifecycle';

const MAX_PIXEL_RATIO = 2;

export interface RendererOptions {
  readonly alpha?: boolean;
  readonly antialias?: boolean;
  readonly maxPixelRatio?: number;
  /** Called after a lost context comes back, so the owner can redraw. */
  readonly onRestore?: () => void;
}

export interface RendererHandle {
  readonly renderer: WebGLRenderer;
  /** False while the GPU context is lost; skip rendering until it returns. */
  isLive(): boolean;
  resize(width: number, height: number, pixelRatio?: number): void;
}

let webglSupport: boolean | null = null;

/** Probes for WebGL once, quietly, so unsupported browsers never reach a failing constructor. */
export function isWebGLAvailable(): boolean {
  if (webglSupport === null) {
    const context = document.createElement('canvas').getContext('webgl2');
    webglSupport = context !== null;
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  }
  return webglSupport;
}

/**
 * Creates a renderer inside `container`, or returns `null` when WebGL is unavailable so
 * callers can fall back to DOM. Context loss is survived rather than treated as fatal.
 */
export function createRenderer(
  container: HTMLElement,
  scope: Scope,
  {
    alpha = true,
    antialias = false,
    maxPixelRatio = MAX_PIXEL_RATIO,
    onRestore,
  }: RendererOptions = {},
): RendererHandle | null {
  if (!isWebGLAvailable()) return null;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      alpha,
      antialias,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  renderer.setClearColor(0x000000, 0);
  container.append(canvas);

  let live = true;
  scope.listen(canvas, 'webglcontextlost', (event) => {
    event.preventDefault();
    live = false;
  });
  scope.listen(canvas, 'webglcontextrestored', () => {
    live = true;
    onRestore?.();
  });
  scope.add(() => {
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  });

  return {
    renderer,
    isLive: () => live,
    resize(width, height, pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio)) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
    },
  };
}
