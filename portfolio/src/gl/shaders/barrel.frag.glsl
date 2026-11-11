uniform sampler2D uMap;
uniform vec3 uBackground;
uniform float uDistortion;
uniform float uDistortion2;
uniform float uEdgeFade;

varying vec2 vUv;

// Radial barrel distortion: the flat list of labels reads as the surface of a drum.
void main() {
  vec2 centered = vUv - 0.5;
  float r2 = dot(centered, centered);
  centered *= 1.0 + uDistortion * r2 + uDistortion2 * r2 * r2;
  vec4 texel = texture2D(uMap, centered + 0.5);
  float edge = smoothstep(0.0, uEdgeFade, vUv.y) * smoothstep(0.0, uEdgeFade, 1.0 - vUv.y);
  float alpha = texel.a * edge;
  gl_FragColor = vec4(uBackground * (1.0 - alpha) + texel.rgb * edge, 1.0);
}
