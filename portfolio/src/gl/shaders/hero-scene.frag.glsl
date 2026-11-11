uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uIntro;

#include <noise>

const vec3 FOG = vec3(0.67);
const vec2 LIGHT = vec2(-0.28, 0.44);
const int LAYERS = 5;

// Jagged skyline of one rock layer: ridged noise gives sharp peaks and steep flanks.
float skyline(float x, float seed) {
  float sum = 0.0;
  float amplitude = 0.55;
  float frequency = 1.0;
  for (int octave = 0; octave < 4; octave++) {
    float n = valueNoise(vec2(x * frequency + seed, seed * 1.7 + float(octave) * 5.3));
    n = 1.0 - abs(n * 2.0 - 1.0);
    sum += n * n * amplitude;
    frequency *= 2.3;
    amplitude *= 0.45;
  }
  return sum;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  // Camera: an eased dolly-in on load, a downward drift with scroll, parallax with the pointer.
  p *= 1.0 + 0.22 * (1.0 - uIntro);
  p.y -= uScroll * 0.25;
  vec2 sway = uPointer * vec2(-0.022, 0.012);

  vec2 toLight = p - LIGHT;
  float lightDistance = length(toLight);
  float glow = exp(-lightDistance * 1.9);

  // Sky: fog glowing around the light, falling off to near black.
  vec3 color = mix(vec3(0.03), FOG, glow);

  // God rays: angular noise streaks fanning out from the light.
  float angle = atan(toLight.y, toLight.x);
  float streaks = fbm(vec2(angle * 9.0, uTime * 0.04));
  float rays = smoothstep(0.35, 0.8, streaks) * exp(-lightDistance * 1.1);

  for (int i = 0; i < LAYERS; i++) {
    float layer = float(i);
    float depth = layer / float(LAYERS - 1);
    float parallax = 1.0 + layer * 1.6;
    float x = p.x + sway.x * parallax + layer * 1.37;
    float base = 0.1 - depth * 0.62 + sway.y * parallax + uScroll * depth * 0.175;
    float height = base + skyline(x * (2.1 - depth * 1.1), 3.0 + layer * 7.3) * (0.44 - depth * 0.12);

    // A monolith stands in the middle distance, lit on the side facing the light.
    if (i == 2) {
      vec2 m = vec2(p.x + sway.x * 4.0 - 0.08, p.y - base);
      float lean = m.y * 0.14;
      float halfWidth = mix(0.13, 0.04, smoothstep(0.0, 0.8, m.y));
      float top = 0.78 + (m.x - lean) * 1.1;
      float body = smoothstep(0.003, -0.003, abs(m.x - lean) - halfWidth);
      body *= smoothstep(0.003, -0.003, m.y - top);
      float lit = smoothstep(0.012, -0.012, m.x - lean + halfWidth * 0.3);
      vec3 stone = mix(vec3(0.015), FOG * 0.62, lit * glow);
      stone *= 0.75 + 0.5 * fbm(vec2(m.x * 34.0, m.y * 5.0));
      color = mix(color, stone, body);
    }

    float inside = smoothstep(0.003, -0.003, p.y - height);
    vec3 rock = mix(vec3(0.2), vec3(0.008), depth);
    float rim = smoothstep(0.05, 0.0, height - p.y) * (1.0 - depth * 0.7) * glow;
    rock += FOG * rim * 0.55;
    rock *= 0.7 + 0.6 * fbm(vec2(x * 9.0, p.y * 26.0 + layer));
    color = mix(color, rock, inside);

    // Smoke drifts in front of each layer, thickest near its base, and catches the rays.
    vec2 q = vec2(x * 1.3 - uTime * 0.018 * parallax, p.y * 2.4 + layer * 2.0);
    float smoke = fbm(q + fbm(q * 1.6 + uTime * 0.03) * 1.3);
    float low = smoothstep(0.5, -0.08, p.y - base);
    float density = smoothstep(0.3, 0.8, smoke) * low * (0.7 - depth * 0.45);
    color = mix(color, FOG * (0.62 - depth * 0.4) * (0.6 + glow), density);
    color += FOG * rays * 0.09 * (1.0 - depth);
  }

  gl_FragColor = vec4(color, 1.0);
}
