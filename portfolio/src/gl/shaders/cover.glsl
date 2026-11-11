// Maps plane UVs so an image fills a plane of a different aspect ratio, cropping the overflow.
vec2 coverUv(vec2 uv, vec2 plane, vec2 image) {
  float planeAspect = plane.x / plane.y;
  float imageAspect = image.x / image.y;
  vec2 scale = vec2(min(planeAspect / imageAspect, 1.0), min(imageAspect / planeAspect, 1.0));
  return (uv - 0.5) * scale + 0.5;
}
