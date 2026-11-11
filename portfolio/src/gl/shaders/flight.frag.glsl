uniform sampler2D uMap;
uniform vec2 uImage;

varying vec2 vUv;
varying vec2 vSize;
varying float vShape;
varying float vArc;

#include <cover>

void main() {
  vec4 color = texture2D(uMap, coverUv(vUv, vSize, uImage));
  color.rgb *= 1.0 + vArc * (vShape - 0.5) * 0.44;
  gl_FragColor = color;
}
