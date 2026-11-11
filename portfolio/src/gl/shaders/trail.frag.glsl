uniform sampler2D uPrevious;
uniform vec2 uTexel;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uAspect;
uniform float uRadius;
uniform float uStrength;
uniform float uFade;

varying vec2 vUv;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

// Dye that the cursor leaves behind: the previous frame is blurred and faded, then a soft
// stroke between the last two pointer positions is stamped on top.
void main() {
  float dye = texture2D(uPrevious, vUv).r * 0.4;
  dye += texture2D(uPrevious, vUv + vec2(uTexel.x, 0.0)).r * 0.15;
  dye += texture2D(uPrevious, vUv - vec2(uTexel.x, 0.0)).r * 0.15;
  dye += texture2D(uPrevious, vUv + vec2(0.0, uTexel.y)).r * 0.15;
  dye += texture2D(uPrevious, vUv - vec2(0.0, uTexel.y)).r * 0.15;
  dye = max(dye * uFade - 0.002, 0.0);

  vec2 scale = vec2(uAspect, 1.0);
  float d = segmentDistance(vUv * scale, uFrom * scale, uTo * scale);
  dye += exp(-d * d / (uRadius * uRadius)) * uStrength;

  gl_FragColor = vec4(vec3(min(dye, 1.0)), 1.0);
}
