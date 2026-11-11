import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
} from 'three';
import type { Scope } from '../core/lifecycle';
import { createRenderer } from './renderer';
import fragmentShader from './shaders/flight.frag.glsl?raw';
import vertexShader from './shaders/flight.vert.glsl?raw';
import { withChunks } from './shaders';
import { imageTexture } from './textures';

const FOV = 45;
const SEGMENTS = 48;
const STRETCH = 0.225;
const LEAD = 0.5;
/** Peak lift toward the camera, as a fraction of the viewport height. */
const LIFT = 0.16;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FlightPlane {
  /** Draws the image `progress` (0–1) of the way from its start rectangle to its destination. */
  render(progress: number): void;
}

/** A finely subdivided image plane that flies between two viewport rectangles. */
export function createFlightPlane(
  container: HTMLElement,
  scope: Scope,
  image: HTMLImageElement,
  from: Rect,
  to: Rect,
): FlightPlane | null {
  const handle = createRenderer(container, scope, { antialias: true });
  if (!handle) return null;
  const { renderer } = handle;
  const width = window.innerWidth;
  const height = window.innerHeight;
  handle.resize(width, height);

  // At this distance one world unit on the z = 0 plane covers exactly one CSS pixel.
  const distance = height / 2 / Math.tan((FOV * Math.PI) / 360);
  const camera = new PerspectiveCamera(FOV, width / height, 1, distance * 4);
  camera.position.z = distance;

  const texture = imageTexture(image);
  const geometry = new PlaneGeometry(1, 1, SEGMENTS, SEGMENTS);
  const uniforms = {
    uMap: { value: texture },
    uImage: { value: new Vector2(image.naturalWidth, image.naturalHeight) },
    uProgress: { value: 0 },
    uLift: { value: LIFT * height },
    uStretch: { value: STRETCH },
    uLead: { value: LEAD },
    uFrom: { value: new Vector4(from.x, from.y, from.width, from.height) },
    uTo: { value: new Vector4(to.x, to.y, to.width, to.height) },
    uView: { value: new Vector2(width, height) },
  };
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader: withChunks(fragmentShader),
    uniforms,
    depthTest: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);

  scope.add(() => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  });

  return {
    render(progress) {
      uniforms.uProgress.value = progress;
      if (handle.isLive()) renderer.render(scene, camera);
    },
  };
}
