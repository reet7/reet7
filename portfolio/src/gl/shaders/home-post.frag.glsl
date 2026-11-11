uniform sampler2D uScene;
uniform sampler2D uTrail;
uniform vec2 uPointer;
uniform float uAspect;
uniform float uLensRadius;
uniform float uLensAmount;
uniform float uTime;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Lens: pixels near the pointer are pulled toward it and brightened.
  vec2 offset = vUv - uPointer;
  offset.x *= uAspect;
  float lens = smoothstep(uLensRadius, 0.0, length(offset));
  vec4 color = texture2D(uScene, mix(vUv, uPointer, lens * uLensAmount));
  color.rgb += color.rgb * lens * uLensAmount * 0.3;

  // Pointer dye lifts the empty background slightly, with a touch of grain.
  float dye = texture2D(uTrail, vUv).r;
  float lift = smoothstep(0.05, 0.7, dye) * 0.05 * (1.0 - color.a);
  float grain = (hash(vUv * 512.0 + uTime) - 0.5) * 0.35;
  color += vec4(vec3(lift * (1.0 + grain)), lift);

  gl_FragColor = color;
}
