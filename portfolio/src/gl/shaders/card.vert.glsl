uniform float uWarp;
uniform float uCenterY;
uniform float uViewHeight;
uniform float uPortrait;
uniform float uBend;
uniform float uEdgeBend;

varying vec2 vUv;

// Scroll velocity swells the cards around the vertical centre of the screen, as if the
// stack passed under a lens: every vertex is scaled away from the centre by k = 1 / (1 - z).
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  float s = clamp((world.y - uCenterY) / (uViewHeight * 0.5), -1.0, 1.0);
  float amount = abs(uWarp);
  float z = uPortrait > 0.5
    ? exp(-s * s * 4.0) * amount * uBend - s * s * amount * uEdgeBend
    : exp(-s * s * 5.0) * uWarp * uBend;
  float k = 1.0 / (1.0 - clamp(z, -0.5, 0.5));
  world.x *= k;
  world.y = uCenterY + (world.y - uCenterY) * k;
  gl_Position = projectionMatrix * viewMatrix * world;
}
