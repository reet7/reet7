uniform sampler2D uMap;
uniform vec2 uPlane;
uniform vec2 uImage;
uniform float uGray;
uniform float uOpacity;

varying vec2 vUv;

#include <cover>

void main() {
  vec3 color = texture2D(uMap, coverUv(vUv, uPlane, uImage)).rgb;
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 gray = mix(vec3(0.5), vec3(luma), 0.88);
  color = mix(color, gray, uGray);
  gl_FragColor = vec4(color * uOpacity, uOpacity);
}
