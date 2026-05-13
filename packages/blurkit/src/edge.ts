import { bytesToDataURL } from './internal/base64'
import { resolveTargetDimensions } from './internal/dimensions'
import { normalizeOptions } from './internal/normalize-options'
import { encodeManySettledWithRuntime, encodeManyWithRuntime, encodeWithRuntime } from './shared'
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

function assertEdgeDecodeCapabilities(): void {
  if (typeof ImageDecoder === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    throw new Error(
      'The current edge runtime is missing ImageDecoder and/or OffscreenCanvas. Use blurkit/cloudflare on Cloudflare Workers, or run blurkit/edge in a runtime that provides both APIs.',
    )
  }
}

function assertEdgeRenderCapabilities(): void {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error(
      'The current edge runtime is missing OffscreenCanvas. Use blurkit/cloudflare on Cloudflare Workers, or run blurkit/edge in a runtime that provides OffscreenCanvas.',
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
  assertEdgeDecodeCapabilities()

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
  assertEdgeRenderCapabilities()

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

const runtime = {
  resolveInput: resolveEdgeInput,
  decodeImage: decodeEdgeImage,
  renderDataURL: renderEdgeDataURL,
}

export async function encode(input: BlurKitEdgeInput, options?: BlurKitOptions): Promise<BlurResult>
export async function encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult> {
  return encodeWithRuntime(input, normalizeOptions(options), runtime)
}

export async function encodeMany(
  inputs: BlurKitEdgeInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]>
export async function encodeMany(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]> {
  return encodeManyWithRuntime(inputs, normalizeOptions(options), runtime)
}

export async function encodeManySettled(
  inputs: BlurKitEdgeInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]>
export async function encodeManySettled(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]> {
  return encodeManySettledWithRuntime(inputs, normalizeOptions(options), runtime)
}
