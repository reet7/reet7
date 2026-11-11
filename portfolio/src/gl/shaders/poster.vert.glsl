uniform vec2 uSize;
uniform float uBend;
uniform float uFlutter;
uniform float uTime;

varying vec2 vUv;
varying float vShade;

// Paper physics on a budget: a parabolic bend driven by scroll velocity plus a sinusoidal flutter.
void main() {
  vUv = uv;
  vec3 p = position;
  float z = uBend * p.y * p.y * 4.0 * uSize.y * 0.22;
  z += sin(p.x * 5.0 + uTime * 2.6) * sin(p.y * 3.5 + uTime * 1.9) * uFlutter * uSize.x * 0.03;
  vShade = z / (max(uSize.x, uSize.y) * 0.22);
  p.z = z / uSize.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
