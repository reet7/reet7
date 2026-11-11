uniform sampler2D uScene;
uniform sampler2D uBlur;
uniform float uAberration;
uniform float uVignette;
uniform float uTime;

varying vec2 vUv;

#include <noise>

const int TAPS = 7;

void main() {
  vec2 centered = vUv - 0.5;
  float r2 = dot(centered, centered);

  // Lens softness grows toward the edges of the frame.
  float soften = smoothstep(0.16, 0.6, r2) * 0.8;

  // Spectral chromatic aberration: each tap samples a slightly different barrel distortion
  // and contributes to the part of the spectrum it stands for.
  vec3 sum = vec3(0.0);
  vec3 weights = vec3(0.0);
  for (int i = 0; i < TAPS; i++) {
    float t = float(i) / float(TAPS - 1);
    vec2 uv = 0.5 + centered * (1.0 + uAberration * r2 * (t - 0.5));
    vec3 tap = mix(texture2D(uScene, uv).rgb, texture2D(uBlur, uv).rgb, soften);
    vec3 weight = vec3(1.0 - t, 1.0 - abs(t - 0.5) * 2.0, t);
    sum += tap * weight;
    weights += weight;
  }
  vec3 color = sum / weights;

  color *= 1.0 - uVignette * smoothstep(0.1, 0.6, r2) * 2.0;
  color += (hash21(vUv * 913.0 + fract(uTime) * 61.0) - 0.5) * 0.045;

  gl_FragColor = vec4(color, 1.0);
}
