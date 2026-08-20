import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import {
  createFilesystemCache,
  createMemoryCache,
  encode,
  encodeMany,
  encodeManySettled,
} from '../src/node'
import type { BlurKitCache } from '../src/types'

function toOwnedArrayBuffer(buffer: Buffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function createTrackingCache(): BlurKitCache & { sets: string[] } {
  const inner = createMemoryCache()
  const sets: string[] = []
  return {
    get(key) {
      return inner.get(key)
    },
    set(key, value) {
      sets.push(key)
      return inner.set(key, value)
    },
    sets,
  }
}

async function createPng(background: { r: number; g: number; b: number; alpha?: number }, width = 64, height = 64): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { ...background, alpha: background.alpha ?? 1 },
    },
  })
    .png()
    .toBuffer()
}

describe('blurkit node runtime', () => {
  it('encodes a blurhash placeholder data URL', async () => {
    const image = await createPng({ r: 230, g: 120, b: 70 })

    const result = await encode(toOwnedArrayBuffer(image), {
      size: 24,
      cache: createMemoryCache(),
    })

    expect(result.algorithm).toBe('blurhash')
    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true)
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
    expect(result.meta.originalWidth).toBe(64)
    expect(result.meta.originalHeight).toBe(64)
  })

  it('encodes multiple thumbhash placeholders', async () => {
    const first = await createPng({ r: 50, g: 90, b: 210 }, 32, 32)
    const second = await createPng({ r: 120, g: 220, b: 120, alpha: 0.5 }, 32, 16)

    const results = await encodeMany(
      [
        toOwnedArrayBuffer(first),
        toOwnedArrayBuffer(second),
      ],
      {
        algorithm: 'thumbhash',
        size: 20,
      },
    )

    expect(results).toHaveLength(2)
    expect(results[0]!.algorithm).toBe('thumbhash')
    expect(results[0]!.hash.length).toBeGreaterThan(0)
  })

  it('supports partial success with encodeManySettled', async () => {
    const valid = await createPng({ r: 20, g: 160, b: 240 }, 24, 24)

    const results = await encodeManySettled(
      [
        toOwnedArrayBuffer(valid),
        new ArrayBuffer(8),
      ],
      {
        size: 16,
      },
    )

    expect(results).toHaveLength(2)
    expect(results[0]!.status).toBe('fulfilled')
    expect(results[1]!.status).toBe('rejected')
    expect(results[0]!.input).toBeInstanceOf(ArrayBuffer)
    expect(results[1]!.input).toBeInstanceOf(ArrayBuffer)
  })

  it('can persist cache entries in filesystem cache', async () => {
    const cacheDir = path.join(tmpdir(), `blurkit-cache-test-${Date.now()}`)
    const fileCache = createFilesystemCache({
      dir: cacheDir,
    })

    const image = await createPng({ r: 180, g: 180, b: 180 }, 12, 12)

    try {
      const first = await encode(toOwnedArrayBuffer(image), {
        size: 10,
        cache: fileCache,
      })

      const second = await encode(toOwnedArrayBuffer(image), {
        size: 10,
        cache: fileCache,
      })

      expect(first.hash).toBe(second.hash)
      expect(first.dataURL).toBe(second.dataURL)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it('accepts Buffer input directly without manual conversion', async () => {
    const image = await createPng({ r: 90, g: 40, b: 200 }, 48, 24)

    const result = await encode(image, { size: 24 })

    expect(result.meta.originalWidth).toBe(48)
    expect(result.meta.originalHeight).toBe(24)
    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('accepts Uint8Array input', async () => {
    const image = await createPng({ r: 10, g: 200, b: 90 }, 32, 32)

    const result = await encode(new Uint8Array(image), { size: 16 })

    expect(result.meta.originalWidth).toBe(32)
    expect(result.meta.originalHeight).toBe(32)
  })

  it('respects a Buffer view with a non-zero offset into a larger allocation', async () => {
    const png = await createPng({ r: 200, g: 60, b: 120 }, 40, 20)

    const backing = Buffer.alloc(png.length + 128)
    png.copy(backing, 32)
    const view = backing.subarray(32, 32 + png.length)

    expect(view.byteOffset).toBe(32)
    expect(view.byteLength).toBe(png.length)

    const result = await encode(view, { size: 20 })

    expect(result.meta.originalWidth).toBe(40)
    expect(result.meta.originalHeight).toBe(20)
    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('produces equivalent output for equivalent Buffer and ArrayBuffer input', async () => {
    const png = await createPng({ r: 70, g: 130, b: 250 }, 24, 24)

    const fromBuffer = await encode(png, { algorithm: 'thumbhash', size: 12 })
    const fromArrayBuffer = await encode(toOwnedArrayBuffer(png), { algorithm: 'thumbhash', size: 12 })

    expect(fromBuffer.hash).toBe(fromArrayBuffer.hash)
    expect(fromBuffer.dataURL).toBe(fromArrayBuffer.dataURL)
    expect(fromBuffer.width).toBe(fromArrayBuffer.width)
  })

  it('does not collide two different ArrayBuffers in a shared cache', async () => {
    const first = await createPng({ r: 230, g: 120, b: 70 })
    const second = await createPng({ r: 20, g: 60, b: 200 })
    const cache = createMemoryCache()

    const resultA = await encode(toOwnedArrayBuffer(first), { size: 24, cache })
    const resultB = await encode(toOwnedArrayBuffer(second), { size: 24, cache })

    expect(resultB.hash).not.toBe(resultA.hash)
    expect(resultB.dataURL).not.toBe(resultA.dataURL)
  })

  it('does not collide two different Uint8Array inputs in a shared cache', async () => {
    const first = await createPng({ r: 10, g: 210, b: 40 })
    const second = await createPng({ r: 200, g: 30, b: 170 })
    const cache = createMemoryCache()

    const resultA = await encode(new Uint8Array(first), { size: 24, cache })
    const resultB = await encode(new Uint8Array(second), { size: 24, cache })

    expect(resultB.hash).not.toBe(resultA.hash)
    expect(resultB.dataURL).not.toBe(resultA.dataURL)
  })

  it('does not collide generic Blob inputs with different bytes', async () => {
    const first = await createPng({ r: 40, g: 90, b: 220 })
    const second = await createPng({ r: 220, g: 140, b: 30 })
    const cache = createMemoryCache()

    const resultA = await encode(new Blob([toOwnedArrayBuffer(first)], { type: 'image/png' }), {
      size: 24,
      cache,
    })
    const resultB = await encode(new Blob([toOwnedArrayBuffer(second)], { type: 'image/png' }), {
      size: 24,
      cache,
    })

    expect(resultB.hash).not.toBe(resultA.hash)
    expect(resultB.dataURL).not.toBe(resultA.dataURL)
  })

  it('reuses the cache entry for identical bytes and options', async () => {
    const image = await createPng({ r: 140, g: 180, b: 60 }, 32, 32)
    const tracking = createTrackingCache()

    const first = await encode(toOwnedArrayBuffer(image), { size: 16, cache: tracking })
    const second = await encode(toOwnedArrayBuffer(image), { size: 16, cache: tracking })

    expect(first.hash).toBe(second.hash)
    expect(first.dataURL).toBe(second.dataURL)
    expect(tracking.sets).toHaveLength(1)
  })

  it('does not collide different output-affecting options', async () => {
    const image = await createPng({ r: 80, g: 80, b: 210 }, 64, 64)
    const tracking = createTrackingCache()

    const small = await encode(toOwnedArrayBuffer(image), { size: 16, cache: tracking })
    const large = await encode(toOwnedArrayBuffer(image), { size: 32, cache: tracking })

    expect(small.width).not.toBe(large.width)
    expect(small.hash).not.toBe(large.hash)
    expect(tracking.sets).toHaveLength(2)
    expect(tracking.sets[0]).not.toBe(tracking.sets[1])
  })

  it('produces a fresh result when the file behind a path changes', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'blurkit-path-change-'))
    const cacheDir = path.join(tmpdir(), `blurkit-fs-cache-${Date.now()}`)
    const filePath = path.join(dir, 'image.png')

    try {
      const original = await createPng({ r: 230, g: 120, b: 70 }, 64, 64)
      const replacement = await createPng({ r: 10, g: 30, b: 220 }, 80, 40)
      await writeFile(filePath, original)

      const fileCache = createFilesystemCache({ dir: cacheDir })
      const first = await encode(filePath, { size: 16, cache: fileCache })

      await writeFile(filePath, replacement)
      const second = await encode(filePath, { size: 16, cache: fileCache })

      expect(second.hash).not.toBe(first.hash)
      expect(second.dataURL).not.toBe(first.dataURL)

      const direct = await encode(filePath, { size: 16 })
      expect(second.hash).toBe(direct.hash)
      expect(second.meta.originalWidth).toBe(80)
      expect(second.meta.originalHeight).toBe(40)
    } finally {
      await rm(dir, { recursive: true, force: true })
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it('resolves the same memory-cache entry for equivalent Buffer and ArrayBuffer input', async () => {
    const png = await createPng({ r: 30, g: 170, b: 120 }, 16, 16)
    const tracking = createTrackingCache()

    const fromBuffer = await encode(png, { size: 8, cache: tracking })
    const fromArrayBuffer = await encode(toOwnedArrayBuffer(png), { size: 8, cache: tracking })

    expect(fromBuffer.hash).toBe(fromArrayBuffer.hash)
    expect(tracking.sets).toHaveLength(1)
  })
})
