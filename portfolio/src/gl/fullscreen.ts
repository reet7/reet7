import { Mesh, OrthographicCamera, PlaneGeometry, ShaderMaterial, type IUniform } from 'three';
import type { Disposable } from '../core/lifecycle';
import vertexShader from './shaders/fullscreen.vert.glsl?raw';

const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

export interface FullscreenPass<U extends Record<string, IUniform>> extends Disposable {
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  readonly camera: OrthographicCamera;
  readonly uniforms: U;
}

/** A screen-covering quad for post-processing and other fragment-only passes. */
export function createFullscreenPass<U extends Record<string, IUniform>>(
  fragmentShader: string,
  uniforms: U,
  options: { transparent?: boolean } = {},
): FullscreenPass<U> {
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    transparent: options.transparent ?? false,
    premultipliedAlpha: true,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return {
    mesh,
    camera,
    uniforms,
    destroy() {
      geometry.dispose();
      material.dispose();
    },
  };
}
