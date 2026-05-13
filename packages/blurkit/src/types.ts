export type BlurAlgorithm = 'blurhash' | 'thumbhash'
export type BlurOutputFormat = 'png' | 'jpeg'

export type BlurKitRemoteURLString = `http://${string}` | `https://${string}`

export type BlurKitInput =
  | string
  | URL
  | File
  | Blob
  | ArrayBuffer

export type BlurKitNodeInput =
  | string
  | URL
  | Blob
  | ArrayBuffer

export type BlurKitBrowserInput =
  | BlurKitRemoteURLString
  | URL
  | File
  | Blob
  | ArrayBuffer

export type BlurKitEdgeInput =
  | BlurKitRemoteURLString
  | URL
  | Blob
  | ArrayBuffer

export interface BlurKitOptions {
  algorithm?: BlurAlgorithm
  size?: number
  width?: number
  height?: number
  componentX?: number
  componentY?: number
  outputFormat?: BlurOutputFormat
  cache?: BlurKitCache
}

export interface BlurResult {
  dataURL: string
  hash: string
  algorithm: BlurAlgorithm
  width: number
  height: number
  meta?: {
    originalWidth: number
    originalHeight: number
    format?: string
    hasAlpha?: boolean
  }
}

export interface BlurKitCache {
  get(key: string): Promise<BlurResult | undefined> | BlurResult | undefined
  set(key: string, value: BlurResult): Promise<void> | void
}

export interface BlurManifest {
  version: 1
  algorithm?: BlurAlgorithm | 'mixed'
  generatedAt: string
  images: Record<string, BlurResult>
}

export interface BlurEncodeManySettledFulfilled {
  status: 'fulfilled'
  input: BlurKitInput
  value: BlurResult
}

export interface BlurEncodeManySettledRejected {
  status: 'rejected'
  input: BlurKitInput
  reason: unknown
}

export type BlurEncodeManySettledResult =
  | BlurEncodeManySettledFulfilled
  | BlurEncodeManySettledRejected

export interface NormalizedBlurKitOptions {
  algorithm: BlurAlgorithm
  size: number
  width?: number
  height?: number
  componentX: number
  componentY: number
  outputFormat: BlurOutputFormat
  cache?: BlurKitCache
}

export interface DecodedImage {
  pixels: Uint8ClampedArray
  width: number
  height: number
  meta: NonNullable<BlurResult['meta']>
}

export interface ResolvedInput {
  identifier: string
  bytes: Uint8Array
  mimeType?: string
}
