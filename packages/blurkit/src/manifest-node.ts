import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { BlurManifest } from './types'

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
