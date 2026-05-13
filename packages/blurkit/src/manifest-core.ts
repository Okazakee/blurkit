import type { BlurManifest, BlurResult } from './types'

export function createManifest(images: Record<string, BlurResult>): BlurManifest {
  const algorithms = Array.from(new Set(Object.values(images).map((image) => image.algorithm)))
  return {
    version: 1,
    algorithm: algorithms.length === 1 ? algorithms[0] : algorithms.length > 1 ? 'mixed' : undefined,
    generatedAt: new Date().toISOString(),
    images,
  }
}
