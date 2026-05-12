import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

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

export async function writeManifest(
  filePath: string,
  manifest: BlurManifest,
  options: { pretty?: boolean } = {},
): Promise<void> {
  await mkdir(path.dirname(path.resolve(filePath)), { recursive: true })
  await writeFile(
    filePath,
    JSON.stringify(manifest, null, options.pretty ? 2 : undefined),
    'utf8',
  )
}

