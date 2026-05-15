import { bytesToDataURL } from './internal/base64'
import { resolveTargetDimensions } from './internal/dimensions'
import { normalizeOptions } from './internal/normalize-options'
import { wasmRuntime } from './internal/wasm-runtime'
import { encodeManySettledWithRuntime, encodeManyWithRuntime, encodeWithRuntime } from './shared'
import type { RuntimeHandlers } from './shared'
import type {
  BlurEncodeManySettledResult,
  BlurKitEdgeInput,
  BlurKitInput,
  BlurKitOptions,
  BlurResult,
  DecodedImage,
  ResolvedInput,
} from './types'

function detectMimeType(bytes: Uint8Array): string | undefined {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg'
  }

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp'
  }

  return undefined
}

function hasNativeEdgeCapabilities(): boolean {
  return typeof ImageDecoder !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
}

function assertNativeEdgeCapabilities(): void {
  if (!hasNativeEdgeCapabilities()) {
    throw new Error(
      'The current edge runtime is missing ImageDecoder and/or OffscreenCanvas for native decode. The wasm fallback runtime should be used instead.',
    )
  }
}

async function resolveEdgeInput(input: BlurKitInput): Promise<ResolvedInput> {
  if (typeof input === 'string' || input instanceof URL) {
    const url = input instanceof URL ? input.toString() : input
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('The edge runtime supports remote URLs, Blob, and ArrayBuffer input only.')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${response.status} ${response.statusText}`)
    }

    return {
      identifier: url,
      bytes: new Uint8Array(await response.arrayBuffer()),
      mimeType: response.headers.get('content-type') ?? undefined,
    }
  }

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return {
      identifier: 'blob',
      bytes: new Uint8Array(await input.arrayBuffer()),
      mimeType: input.type || undefined,
    }
  }

  if (input instanceof ArrayBuffer) {
    return {
      identifier: 'arraybuffer',
      bytes: new Uint8Array(input),
    }
  }

  throw new Error('Unsupported input type for the edge runtime.')
}

async function decodeEdgeImage(
  resolved: ResolvedInput,
  options: ReturnType<typeof normalizeOptions>,
): Promise<DecodedImage> {
  assertNativeEdgeCapabilities()

  const mimeType = resolved.mimeType ?? detectMimeType(resolved.bytes)
  if (!mimeType) {
    throw new Error('Unable to determine image MIME type for edge decoding.')
  }

  const decoder = new ImageDecoder({
    type: mimeType,
    data: resolved.bytes,
  })

  try {
    const { image } = await decoder.decode({ frameIndex: 0 })
    const originalWidth = image.displayWidth
    const originalHeight = image.displayHeight
    const target = resolveTargetDimensions(originalWidth, originalHeight, options)
    const canvas = new OffscreenCanvas(target.width, target.height)
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not create an OffscreenCanvas 2D context.')
    }

    context.drawImage(image, 0, 0, target.width, target.height)
    const imageData = context.getImageData(0, 0, target.width, target.height)

    let hasAlpha = false
    for (let index = 3; index < imageData.data.length; index += 4) {
      if (imageData.data[index] !== 255) {
        hasAlpha = true
        break
      }
    }

    return {
      pixels: imageData.data,
      width: target.width,
      height: target.height,
      meta: {
        originalWidth,
        originalHeight,
        format: mimeType.replace('image/', ''),
        hasAlpha,
      },
    }
  } finally {
    decoder.close()
  }
}

async function renderEdgeDataURL(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
): Promise<string> {
  assertNativeEdgeCapabilities()

  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not create an OffscreenCanvas 2D context.')
  }

  context.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0)
  const blob = await canvas.convertToBlob({
    type: `image/${format}`,
    quality: format === 'jpeg' ? 0.8 : undefined,
  })

  return bytesToDataURL(new Uint8Array(await blob.arrayBuffer()), `image/${format}`)
}

const nativeRuntime: RuntimeHandlers = {
  resolveInput: resolveEdgeInput,
  decodeImage: decodeEdgeImage,
  renderDataURL: renderEdgeDataURL,
}

function selectedEdgeRuntime(): RuntimeHandlers {
  return hasNativeEdgeCapabilities() ? nativeRuntime : wasmRuntime
}

function toFallbackError(error: unknown): Error {
  if (error instanceof Error && (error as Error & { code?: string }).code === 'BLURKIT_MISSING_WASM_CODECS') {
    return error
  }

  const reason = error instanceof Error ? error.message : String(error)
  return new Error(
    `blurkit/edge could not run native decode APIs (ImageDecoder + OffscreenCanvas unavailable) and the wasm fallback failed: ${reason}`,
  )
}

export async function encode(input: BlurKitEdgeInput, options?: BlurKitOptions): Promise<BlurResult>
export async function encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult> {
  const normalized = normalizeOptions(options)
  const runtime = selectedEdgeRuntime()
  if (runtime === nativeRuntime) {
    return encodeWithRuntime(input, normalized, runtime)
  }

  try {
    return await encodeWithRuntime(input, normalized, runtime)
  } catch (error) {
    throw toFallbackError(error)
  }
}

export async function encodeMany(
  inputs: BlurKitEdgeInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]>
export async function encodeMany(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]> {
  const normalized = normalizeOptions(options)
  const runtime = selectedEdgeRuntime()
  if (runtime === nativeRuntime) {
    return encodeManyWithRuntime(inputs, normalized, runtime)
  }

  try {
    return await encodeManyWithRuntime(inputs, normalized, runtime)
  } catch (error) {
    throw toFallbackError(error)
  }
}

export async function encodeManySettled(
  inputs: BlurKitEdgeInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]>
export async function encodeManySettled(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]> {
  const normalized = normalizeOptions(options)
  const runtime = selectedEdgeRuntime()
  if (runtime === nativeRuntime) {
    return encodeManySettledWithRuntime(inputs, normalized, runtime)
  }

  try {
    return await encodeManySettledWithRuntime(inputs, normalized, runtime)
  } catch (error) {
    throw toFallbackError(error)
  }
}
