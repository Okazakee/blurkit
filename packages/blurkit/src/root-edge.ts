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
  BlurKitWasmInput,
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
  throw new Error(
      'writeManifest needs a filesystem runtime (blurkit/node, blurkit/deno). In browser and worker code, use createManifest() and persist the JSON yourself.',
    )
}
