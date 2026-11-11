import cover from './cover.glsl?raw';
import noise from './noise.glsl?raw';

const chunks: Record<string, string> = { cover, noise };

/** Resolves `#include <name>` against the local shader chunks. */
export function withChunks(source: string): string {
  return source.replace(/^#include <(\w+)>$/gm, (line, name: string) => chunks[name] ?? line);
}
