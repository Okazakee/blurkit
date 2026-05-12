import { resolveTargetDimensions } from './internal/dimensions'
import { normalizeOptions } from './internal/normalize-options'
import { encodeManyWithRuntime, encodeWithRuntime } from './shared'
import type { BlurKitInput, BlurKitOptions, BlurResult, DecodedImage, ResolvedInput } from './types'

function isRemoteString(input: string): boolean {
  return /^https?:\/\//i.test(input)
}

async function loadBrowserSource(input: BlurKitInput): Promise<{ identifier: string; blob: Blob; url?: string }> {
  if (typeof input === 'string') {
    if (isRemoteString(input)) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch remote image: ${response.status} ${response.statusText}`)
      }

      return {
        identifier: input,
        blob: await response.blob(),
        url: input,
      }
    }

    throw new Error('The browser runtime does not support local filesystem paths.')
  }

  if (input instanceof URL) {
    return loadBrowserSource(input.toString())
  }

  if (input instanceof Blob) {
    return {
      identifier: typeof File !== 'undefined' && input instanceof File ? input.name : 'blob',
      blob: input,
    }
  }

  if (input instanceof ArrayBuffer) {
    return {
      identifier: 'arraybuffer',
      blob: new Blob([input]),
    }
  }

  throw new Error('Unsupported input type for the browser runtime.')
}

async function resolveBrowserInput(input: BlurKitInput): Promise<ResolvedInput> {
  const source = await loadBrowserSource(input)
  return {
    identifier: source.identifier,
    bytes: new Uint8Array(await source.blob.arrayBuffer()),
    mimeType: source.blob.type || undefined,
  }
}

async function decodeBrowserImage(
  resolved: ResolvedInput,
  options: ReturnType<typeof normalizeOptions>,
): Promise<DecodedImage> {
  const blob = new Blob([new Uint8Array(resolved.bytes)], { type: resolved.mimeType || 'image/png' })
  const objectURL = URL.createObjectURL(blob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.decoding = 'async'
      element.onload = () => resolve(element)
      element.onerror = () =>
        reject(
          new Error('Failed to decode image in the browser runtime. Check CORS headers for remote URLs.'),
        )
      element.src = objectURL
    })

    const target = resolveTargetDimensions(image.naturalWidth, image.naturalHeight, options)
    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not create a 2D canvas context.')
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
        originalWidth: image.naturalWidth,
        originalHeight: image.naturalHeight,
        format: resolved.mimeType?.replace('image/', ''),
        hasAlpha,
      },
    }
  } finally {
    URL.revokeObjectURL(objectURL)
  }
}

async function renderBrowserDataURL(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not create a 2D canvas context.')
  }

  context.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0)
  return canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.8 : undefined)
}

const runtime = {
  resolveInput: resolveBrowserInput,
  decodeImage: decodeBrowserImage,
  renderDataURL: renderBrowserDataURL,
}

export async function encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult> {
  return encodeWithRuntime(input, normalizeOptions(options), runtime)
}

export async function encodeMany(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]> {
  return encodeManyWithRuntime(inputs, normalizeOptions(options), runtime)
}
