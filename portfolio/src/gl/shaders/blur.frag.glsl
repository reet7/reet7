uniform sampler2D uMap;
uniform vec2 uStep;

varying vec2 vUv;

// One direction of a separable 9-tap Gaussian blur.
void main() {
  vec4 sum = texture2D(uMap, vUv) * 0.227;
  sum += (texture2D(uMap, vUv + uStep * 1.385) + texture2D(uMap, vUv - uStep * 1.385)) * 0.316;
  sum += (texture2D(uMap, vUv + uStep * 3.231) + texture2D(uMap, vUv - uStep * 3.231)) * 0.07;
  gl_FragColor = sum;
}
