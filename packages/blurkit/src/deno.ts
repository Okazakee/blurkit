import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { bytesToDataURL } from './internal/base64'
import { toOwnedBytes } from './internal/bytes'
import { isStringInput } from './internal/input-guards'
import { normalizeOptions } from './internal/normalize-options'
import { wasmRuntime } from './internal/wasm-runtime'
import { encodeManySettledWithRuntime, encodeManyWithRuntime, encodeWithRuntime } from './shared'
import type { RuntimeHandlers } from './shared'
import type {
  BlurEncodeManySettledResult,
  BlurKitDenoInput,
  BlurKitInput,
  BlurKitOptions,
  BlurResult,
} from './types'
import { createFilesystemCache, createMemoryCache } from './cache'
import { createManifest } from './manifest-core'
import { writeManifest } from './manifest-node'

function isRemote(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

async function resolveDenoInput(input: BlurKitInput): Promise<{ identifier: string; bytes: Uint8Array; mimeType?: string }> {
  if (isStringInput(input)) {
    if (isRemote(input)) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch remote image: ${response.status} ${response.statusText}`)
      }

      return {
        identifier: input,
        bytes: new Uint8Array(await response.arrayBuffer()),
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
    return resolveDenoInput(input.toString())
  }

  if (globalThis.Blob !== undefined && input instanceof Blob) {
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

  if (input instanceof Uint8Array) {
    return {
      identifier: 'uint8array',
      bytes: toOwnedBytes(input),
    }
  }

  throw new Error('Unsupported input type for the Deno runtime.')
}

function hasCanvasCapabilities(): boolean {
  if (globalThis.OffscreenCanvas === undefined) {
    return false
  }

  try {
    // Deno ships a WebGPU-only OffscreenCanvas whose getContext('2d') returns
    // null; only report canvas capabilities when a 2D context can actually be
    // created so rendering falls back to the wasm codecs path there.
    return new OffscreenCanvas(1, 1).getContext('2d') !== null
  } catch {
    return false
  }
}

async function renderCanvasDataURL(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
): Promise<string> {
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

async function renderDenoDataURL(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
): Promise<string> {
  if (hasCanvasCapabilities()) {
    return renderCanvasDataURL(pixels, width, height, format)
  }

  return wasmRuntime.renderDataURL(pixels, width, height, format)
}

const runtime: RuntimeHandlers = {
  resolveInput: resolveDenoInput,
  decodeImage: (resolved, options) => wasmRuntime.decodeImage(resolved, options),
  renderDataURL: renderDenoDataURL,
}

function toDenoError(cause: unknown): Error {
  // SAFETY: Node module-resolution failures expose a string `code`; the
  // missing-wasm-codecs error is recognized by its canonical code value.
  if (cause instanceof Error && (cause as Error & { code?: string }).code === 'BLURKIT_MISSING_WASM_CODECS') {
    return cause
  }

  const reason = cause instanceof Error ? cause.message : String(cause)
  return new Error(
    `blurkit/deno encode failed: ${reason}`,
  )
}

export async function encode(input: BlurKitDenoInput, options?: BlurKitOptions): Promise<BlurResult>
export async function encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult> {
  const normalized = normalizeOptions(options)
  try {
    return await encodeWithRuntime(input, normalized, runtime)
  } catch (error) {
    throw toDenoError(error)
  }
}

export async function encodeMany(
  inputs: BlurKitDenoInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]>
export async function encodeMany(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]> {
  const normalized = normalizeOptions(options)
  try {
    return await encodeManyWithRuntime(inputs, normalized, runtime)
  } catch (error) {
    throw toDenoError(error)
  }
}

export async function encodeManySettled(
  inputs: BlurKitDenoInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]>
export async function encodeManySettled(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]> {
  const normalized = normalizeOptions(options)
  try {
    return await encodeManySettledWithRuntime(inputs, normalized, runtime)
  } catch (error) {
    throw toDenoError(error)
  }
}

export {
  createFilesystemCache,
  createMemoryCache,
  createManifest,
  writeManifest,
}
