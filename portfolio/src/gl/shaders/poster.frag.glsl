uniform sampler2D uFront;
uniform sampler2D uBack;
uniform float uReveal;
uniform float uBurn;

varying vec2 vUv;
varying float vShade;

#include <noise>

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec4 color = gl_FrontFacing
    ? texture2D(uFront, vUv)
    : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));
  color.rgb *= 1.0 - abs(vShade) * 0.22;
  color.rgb += max(vShade, 0.0) * 0.05;

  float grain = fbm(vUv * vec2(5.0, 7.0));

  // Entrance: the sheet dissolves in through a noise threshold.
  float alpha = smoothstep(grain - 0.05, grain + 0.05, mix(0.0, 1.31, uReveal));

  // Exit: a ragged edge climbs the sheet, glowing with a spectral fringe as it burns.
  float front = uBurn * 1.6 - 0.3;
  float distanceToFront = vUv.y + (grain - 0.5) * 0.45 - front;
  float fringe = 1.0 - smoothstep(0.0, 0.07, distanceToFront);
  float burning = step(0.001, uBurn);
  color.rgb = mix(color.rgb, vec3(0.04), fringe * 0.85 * burning);
  color.rgb += spectrum(distanceToFront * 9.0 + grain) * fringe * burning * 1.1;
  alpha *= mix(1.0, smoothstep(0.0, 0.012, distanceToFront), burning);

  gl_FragColor = vec4(color.rgb * alpha, alpha);
}
