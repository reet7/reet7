import { LinearFilter, NoColorSpace, Texture } from 'three';

const images = new Map<string, Promise<HTMLImageElement>>();

/** Loads and decodes an image once per URL; every GL context builds its own texture from it. */
export function loadImage(url: string): Promise<HTMLImageElement> {
  let pending = images.get(url);
  if (!pending) {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    pending = image.decode().then(() => image);
    images.set(url, pending);
  }
  return pending;
}

export function imageTexture(image: TexImageSource): Texture {
  const texture = new Texture(image);
  // Shaders pass image colours straight through, so no colour-space conversion is wanted.
  texture.colorSpace = NoColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
