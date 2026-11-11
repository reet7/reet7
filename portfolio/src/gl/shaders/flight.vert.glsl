uniform float uProgress;
uniform float uLift;
uniform float uStretch;
uniform float uLead;
uniform vec4 uFrom;
uniform vec4 uTo;
uniform vec2 uView;

varying vec2 vUv;
varying vec2 vSize;
varying float vShape;
varying float vArc;

const float PI = 3.14159265;

// The image travels between two screen rectangles like a sheet being pulled by one corner:
// vertices nearer the destination lead, the rest trail behind, and the sheet lifts toward
// the camera mid-flight.
void main() {
  vUv = uv;

  vec2 fromCenter = uFrom.xy + uFrom.zw * 0.5;
  vec2 toCenter = uTo.xy + uTo.zw * 0.5;
  vec2 direction = vec2(toCenter.x - fromCenter.x, fromCenter.y - toCenter.y);
  float alongX = mix(1.0 - uv.x, uv.x, step(0.0, direction.x));
  float alongY = mix(1.0 - uv.y, uv.y, step(0.0, direction.y));
  float lead = sqrt(alongX * alongX * 0.6 + alongY * alongY * 0.4);

  float progress = clamp(uProgress / max(1.0 - lead * uStretch, 0.001), 0.0, 1.0);
  progress = 1.0 - (1.0 - progress) * (1.0 - progress);

  vec2 corner = vec2(uv.x, 1.0 - uv.y);
  vec2 pixel = mix(uFrom.xy + corner * uFrom.zw, uTo.xy + corner * uTo.zw, progress);

  float arc = uProgress * (1.0 - uProgress) * 4.0;
  float dome = sin(uv.x * PI) * sin(uv.y * PI);
  float shape = mix(dome, lead, uLead);

  vShape = shape;
  vArc = arc;
  vSize = mix(uFrom.zw, uTo.zw, progress);

  vec3 world = vec3(pixel.x - uView.x * 0.5, uView.y * 0.5 - pixel.y, arc * shape * uLift);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
