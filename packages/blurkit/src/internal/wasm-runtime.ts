import jpegDecode, { init as initJpegDecode } from '@jsquash/jpeg/decode.js'
import jpegEncode, { init as initJpegEncode } from '@jsquash/jpeg/encode.js'
import pngDecode, { init as initPngDecode } from '@jsquash/png/decode.js'
import pngEncode, { init as initPngEncode } from '@jsquash/png/encode.js'
import resize, { initResize } from '@jsquash/resize'
import webpDecode, { init as initWebpDecode } from '@jsquash/webp/decode.js'

import { bytesToDataURL } from './base64'
import { resolveTargetDimensions } from './dimensions'
import type { RuntimeHandlers } from '../shared'
import type { DecodedImage, NormalizedBlurKitOptions, ResolvedInput, BlurKitInput } from '../types'

type SupportedMimeType = 'image/png' | 'image/jpeg' | 'image/webp'

let nodeWasmInitPromise: Promise<void> | undefined

function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && typeof process.versions?.node === 'string'
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function detectMimeType(bytes: Uint8Array): SupportedMimeType | undefined {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg'
  }

  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp'
  }

  return undefined
}

function normalizeMimeType(value: string | undefined): SupportedMimeType | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.split(';')[0]?.trim().toLowerCase()
  if (normalized === 'image/jpg') {
    return 'image/jpeg'
  }

  if (normalized === 'image/png' || normalized === 'image/jpeg' || normalized === 'image/webp') {
    return normalized
  }

  return undefined
}

function resolveSupportedMimeType(resolved: ResolvedInput): SupportedMimeType {
  const declared = normalizeMimeType(resolved.mimeType)
  if (declared) {
    return declared
  }

  const detected = detectMimeType(resolved.bytes)
  if (detected) {
    return detected
  }

  throw new Error(
    'Unsupported image format for blurkit/wasm. Supported formats are PNG, JPEG, and WebP.',
  )
}

function ensureImageDataPolyfill(): void {
  if (typeof ImageData !== 'undefined') {
    return
  }

  class NodeImageData {
    data: Uint8ClampedArray
    width: number
    height: number
    colorSpace: 'srgb'

    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data
      this.width = width
      this.height = height
      this.colorSpace = 'srgb'
    }
  }

  ;(globalThis as typeof globalThis & { ImageData: typeof ImageData }).ImageData = NodeImageData as unknown as typeof ImageData
}

async function initNodeWasmCodecs(): Promise<void> {
  const [{ createRequire }, { readFile }] = await Promise.all([
    import('node:module'),
    import('node:fs/promises'),
  ])

  ensureImageDataPolyfill()

  const require = createRequire(import.meta.url)
  const [jpegDecBytes, jpegEncBytes, pngBytes, webpDecBytes, resizeBytes] = await Promise.all([
    readFile(require.resolve('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm')),
    readFile(require.resolve('@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm')),
    readFile(require.resolve('@jsquash/png/codec/pkg/squoosh_png_bg.wasm')),
    readFile(require.resolve('@jsquash/webp/codec/dec/webp_dec.wasm')),
    readFile(require.resolve('@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm')),
  ])

  const [jpegDecModule, jpegEncModule, webpDecModule] = await Promise.all([
    WebAssembly.compile(jpegDecBytes),
    WebAssembly.compile(jpegEncBytes),
    WebAssembly.compile(webpDecBytes),
  ])

  await Promise.all([
    initJpegDecode(jpegDecModule),
    initJpegEncode(jpegEncModule),
    initPngDecode(pngBytes),
    initPngEncode(pngBytes),
    initWebpDecode(webpDecModule),
    initResize(resizeBytes),
  ])
}

async function ensureWasmCodecsReady(): Promise<void> {
  ensureImageDataPolyfill()

  if (!isNodeRuntime()) {
    return
  }

  if (!nodeWasmInitPromise) {
    nodeWasmInitPromise = initNodeWasmCodecs().catch((error: unknown) => {
      nodeWasmInitPromise = undefined
      throw error
    })
  }

  await nodeWasmInitPromise
}

function imageDataFromPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): ImageData {
  const normalizedPixels = new Uint8ClampedArray(pixels.length)
  normalizedPixels.set(pixels)
  return new ImageData(normalizedPixels, width, height)
}

function toClampedArray(data: Uint8ClampedArray | Uint8Array): Uint8ClampedArray {
  if (data instanceof Uint8ClampedArray) {
    return data
  }

  return new Uint8ClampedArray(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))
}

function hasAnyAlpha(pixels: Uint8ClampedArray): boolean {
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 255) {
      return true
    }
  }

  return false
}

async function resolveWasmInput(input: BlurKitInput): Promise<ResolvedInput> {
  if (typeof input === 'string' || input instanceof URL) {
    const url = input instanceof URL ? input.toString() : input
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('blurkit/wasm supports remote URLs, Blob, and ArrayBuffer input only.')
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

  throw new Error('Unsupported input type for blurkit/wasm.')
}

async function decodeWasmImage(
  resolved: ResolvedInput,
  options: NormalizedBlurKitOptions,
): Promise<DecodedImage> {
  await ensureWasmCodecsReady()

  const mimeType = resolveSupportedMimeType(resolved)
  const sourceBuffer = toArrayBuffer(resolved.bytes)

  const decoded = mimeType === 'image/png'
    ? await pngDecode(sourceBuffer)
    : mimeType === 'image/jpeg'
      ? await jpegDecode(sourceBuffer)
      : await webpDecode(sourceBuffer)

  const originalWidth = decoded.width
  const originalHeight = decoded.height
  const target = resolveTargetDimensions(originalWidth, originalHeight, options)

  const inputPixels = toClampedArray(decoded.data)
  const resized = (target.width === originalWidth && target.height === originalHeight)
    ? imageDataFromPixels(inputPixels, originalWidth, originalHeight)
    : await resize(imageDataFromPixels(inputPixels, originalWidth, originalHeight), {
        width: target.width,
        height: target.height,
        method: 'lanczos3',
        fitMethod: 'stretch',
      })

  const pixels = toClampedArray(resized.data)

  return {
    pixels,
    width: target.width,
    height: target.height,
    meta: {
      originalWidth,
      originalHeight,
      format: mimeType.replace('image/', ''),
      hasAlpha: hasAnyAlpha(pixels),
    },
  }
}

async function renderWasmDataURL(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
): Promise<string> {
  await ensureWasmCodecsReady()

  const imageData = imageDataFromPixels(pixels, width, height)
  const encoded = format === 'jpeg'
    ? await jpegEncode(imageData, { quality: 80 })
    : await pngEncode(imageData)

  return bytesToDataURL(new Uint8Array(encoded), `image/${format}`)
}

export const wasmRuntime: RuntimeHandlers = {
  resolveInput: resolveWasmInput,
  decodeImage: decodeWasmImage,
  renderDataURL: renderWasmDataURL,
}
