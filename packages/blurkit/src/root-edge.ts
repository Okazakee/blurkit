import type { BlurManifest } from './types'

export type {
  BlurAlgorithm,
  BlurEncodeManySettledResult,
  BlurKitBrowserInput,
  BlurKitCache,
  BlurKitEdgeInput,
  BlurKitInput,
  BlurKitNodeInput,
  BlurKitOptions,
  BlurKitRemoteURLString,
  BlurManifest,
  BlurOutputFormat,
  BlurResult,
} from './types'

export {
  createManifest,
} from './manifest-core'

export {
  encode,
  encodeMany,
  encodeManySettled,
} from './edge'

export async function writeManifest(
  _filePath: string,
  _manifest: BlurManifest,
  _options: { pretty?: boolean } = {},
): Promise<never> {
  throw new Error('writeManifest is only available in Node/Bun runtimes. Use blurkit/node.')
}
