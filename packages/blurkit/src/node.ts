import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { createFilesystemCache, createMemoryCache } from './cache'
import { resolveTargetDimensions } from './internal/dimensions'
import { bytesToDataURL } from './internal/base64'
import { normalizeOptions } from './internal/normalize-options'
import { createManifest } from './manifest-core'
import { writeManifest } from './manifest-node'
import { encodeManySettledWithRuntime, encodeManyWithRuntime, encodeWithRuntime } from './shared'
import type {
  BlurEncodeManySettledResult,
  BlurKitInput,
  BlurKitOptions,
  BlurResult,
  DecodedImage,
  ResolvedInput,
} from './types'

export const BLURKIT_MISSING_SHARP = 'BLURKIT_MISSING_SHARP'

type SharpFactory = (input: unknown, options?: unknown) => any

let sharpFactoryPromise: Promise<SharpFactory> | undefined

function createMissingSharpError(cause?: unknown): Error & { code: string } {
  const error = new Error(
    'BLURKIT_MISSING_SHARP: The Node runtime requires "sharp". Install it with `npm install sharp` (or avoid `--omit=optional`).',
  ) as Error & { code: string; cause?: unknown }
  error.code = BLURKIT_MISSING_SHARP
  if (cause !== undefined) {
    error.cause = cause
  }
  return error
}

async function getSharpFactory(): Promise<SharpFactory> {
  if (!sharpFactoryPromise) {
    sharpFactoryPromise = import('sharp')
      .then((module) => {
        const maybeDefault = (module as { default?: unknown }).default
        const sharpFactory = (maybeDefault ?? module) as unknown

        if (typeof sharpFactory !== 'function') {
          throw createMissingSharpError()
        }

        return sharpFactory as SharpFactory
      })
      .catch((error: unknown) => {
        throw createMissingSharpError(error)
      })
  }

  return sharpFactoryPromise
}

function isRemote(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

async function toNodeBytes(input: BlurKitInput): Promise<ResolvedInput> {
  if (typeof input === 'string') {
    if (isRemote(input)) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch remote image: ${response.status} ${response.statusText}`)
      }

      const bytes = new Uint8Array(await response.arrayBuffer())
      return {
        identifier: input,
        bytes,
        mimeType: response.headers.get('content-type') ?? undefined,
      }
    }

    const absolutePath = path.resolve(input)
    return {
      identifier: absolutePath,
      bytes: new Uint8Array(await readFile(absolutePath)),
    }
  }

  if (input instanceof URL) {
    return toNodeBytes(input.toString())
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

  throw new Error('Unsupported input type for the Node runtime.')
}

async function decodeNodeImage(
  resolved: ResolvedInput,
  options: ReturnType<typeof normalizeOptions>,
): Promise<DecodedImage> {
  const sharp = await getSharpFactory()
  const basePipeline = sharp(resolved.bytes, { animated: false }).rotate()
  const metadata = await basePipeline.metadata()
  const originalWidth = metadata.width
  const originalHeight = metadata.height

  if (!originalWidth || !originalHeight) {
    throw new Error('Unable to determine image dimensions.')
  }

  const target = resolveTargetDimensions(originalWidth, originalHeight, options)
  const resized = await sharp(resolved.bytes, { animated: false })
    .rotate()
    .resize({ width: target.width, height: target.height, fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return {
    pixels: new Uint8ClampedArray(resized.data.buffer, resized.data.byteOffset, resized.data.byteLength),
    width: resized.info.width,
    height: resized.info.height,
    meta: {
      originalWidth,
      originalHeight,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
    },
  }
}

async function renderNodeDataURL(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
): Promise<string> {
  const sharp = await getSharpFactory()
  const buffer = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)
  const output = sharp(buffer, { raw: { width, height, channels: 4 } })
  const rendered =
    format === 'jpeg'
      ? await output.jpeg({ quality: 80 }).toBuffer()
      : await output.png().toBuffer()

  return bytesToDataURL(rendered, `image/${format}`)
}

const runtime = {
  resolveInput: toNodeBytes,
  decodeImage: decodeNodeImage,
  renderDataURL: renderNodeDataURL,
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

export async function encodeManySettled(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]> {
  return encodeManySettledWithRuntime(inputs, normalizeOptions(options), runtime)
}

export {
  createFilesystemCache,
  createMemoryCache,
  createManifest,
  writeManifest,
}
