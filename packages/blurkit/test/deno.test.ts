import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import {
  createFilesystemCache,
  createMemoryCache,
  createManifest,
  encode,
  encodeMany,
  encodeManySettled,
  writeManifest,
} from '../src/deno'

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

describe('blurkit deno runtime', () => {
  it('encodes a blurhash placeholder from ArrayBuffer', async () => {
    const image = await sharp({
      create: {
        width: 64,
        height: 32,
        channels: 4,
        background: { r: 230, g: 120, b: 70, alpha: 1 },
      },
    }).png().toBuffer()

    const result = await encode(toArrayBuffer(image), { size: 24 })

    expect(result.algorithm).toBe('blurhash')
    expect(result.dataURL.startsWith('data:image/')).toBe(true)
    expect(result.width).toBe(24)
    expect(result.height).toBe(12)
    expect(result.meta?.originalWidth).toBe(64)
    expect(result.meta?.originalHeight).toBe(32)
  })

  it('encodes a thumbhash placeholder from a Blob', async () => {
    const png = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 50, g: 90, b: 210, alpha: 1 },
      },
    }).png().toBuffer()

    const blobData = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer
    const blob = new Blob([blobData], { type: 'image/png' })
    const result = await encode(blob, { algorithm: 'thumbhash', size: 20 })

    expect(result.algorithm).toBe('thumbhash')
    expect(result.hash.length).toBeGreaterThan(10)
    expect(result.width).toBe(20)
    expect(result.height).toBe(20)
  })

  it('encodes a PNG, JPEG, and WebP ArrayBuffer input', async () => {
    const base = sharp({
      create: {
        width: 24,
        height: 16,
        channels: 4,
        background: { r: 30, g: 140, b: 220, alpha: 0.75 },
      },
    })

    const formats: Array<'png' | 'jpeg' | 'webp'> = ['png', 'jpeg', 'webp']

    for (const format of formats) {
      const buffer = await base.clone()[format]().toBuffer()
      const result = await encode(toArrayBuffer(buffer), { size: 12 })

      expect(result.dataURL.startsWith('data:image/')).toBe(true)
      expect(result.hash.length).toBeGreaterThan(10)
      expect(result.width).toBe(12)
      expect(result.height).toBe(8)
    }
  })

  it('encodes multiple thumbhash placeholders with encodeMany', async () => {
    const first = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 50, g: 90, b: 210, alpha: 1 },
      },
    }).png().toBuffer()
    const second = await sharp({
      create: {
        width: 32,
        height: 16,
        channels: 4,
        background: { r: 120, g: 220, b: 120, alpha: 0.5 },
      },
    }).png().toBuffer()

    const results = await encodeMany(
      [toArrayBuffer(first), toArrayBuffer(second)],
      { algorithm: 'thumbhash', size: 20 },
    )

    expect(results).toHaveLength(2)
    expect(results[0]!.algorithm).toBe('thumbhash')
    expect(results[0]!.hash.length).toBeGreaterThan(0)
  })

  it('supports partial success with encodeManySettled', async () => {
    const valid = await sharp({
      create: {
        width: 24,
        height: 24,
        channels: 4,
        background: { r: 20, g: 160, b: 240, alpha: 1 },
      },
    }).png().toBuffer()

    const results = await encodeManySettled(
      [toArrayBuffer(valid), new ArrayBuffer(8)],
      { size: 16 },
    )

    expect(results).toHaveLength(2)
    expect(results[0]!.status).toBe('fulfilled')
    expect(results[1]!.status).toBe('rejected')
  })

  it('returns deterministic hashes with memory cache', async () => {
    const input = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 80, b: 90, alpha: 1 },
      },
    }).png().toBuffer()

    const cache = createMemoryCache()
    const first = await encode(toArrayBuffer(input), { algorithm: 'thumbhash', size: 10, cache })
    const second = await encode(toArrayBuffer(input), { algorithm: 'thumbhash', size: 10, cache })

    expect(first.hash).toBe(second.hash)
    expect(first.dataURL).toBe(second.dataURL)
  })

  it('persists cache entries with filesystem cache', async () => {
    const cacheDir = path.join(tmpdir(), `blurkit-deno-cache-test-${Date.now()}`)
    const fileCache = createFilesystemCache({ dir: cacheDir })

    const image = await sharp({
      create: {
        width: 12,
        height: 12,
        channels: 4,
        background: { r: 180, g: 180, b: 180, alpha: 1 },
      },
    }).png().toBuffer()

    try {
      const first = await encode(toArrayBuffer(image), { size: 10, cache: fileCache })
      const second = await encode(toArrayBuffer(image), { size: 10, cache: fileCache })

      expect(first.hash).toBe(second.hash)
      expect(first.dataURL).toBe(second.dataURL)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it('creates a manifest from multiple inputs', async () => {
    const first = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 4,
        background: { r: 100, g: 100, b: 100, alpha: 1 },
      },
    }).png().toBuffer()
    const second = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 },
      },
    }).png().toBuffer()

    const results = await encodeMany([toArrayBuffer(first), toArrayBuffer(second)], { size: 8 })
    const manifest = createManifest({ '/a.png': results[0]!, '/b.png': results[1]! })

    expect(manifest.version).toBe(1)
    expect(manifest.images['/a.png']).toBeTruthy()
    expect(manifest.images['/b.png']).toBeTruthy()
  })

  it('writes a manifest JSON file', async () => {
    const outDir = path.join(tmpdir(), `blurkit-deno-manifest-test-${Date.now()}`)
    const outPath = path.join(outDir, 'manifest.json')

    const image = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 4,
        background: { r: 50, g: 50, b: 50, alpha: 1 },
      },
    }).png().toBuffer()

    try {
      const result = await encode(toArrayBuffer(image), { size: 8 })
      const manifest = createManifest({ '/image.png': result })

      await expect(writeManifest(outPath, manifest)).resolves.toBeUndefined()

      const raw = await readFile(outPath, 'utf8')
      const parsed = JSON.parse(raw)

      expect(parsed.images['/image.png'].hash).toBe(result.hash)
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('rejects local file path strings that do not exist', async () => {
    const encodeUnsafe = encode as (input: string) => Promise<unknown>
    await expect(encodeUnsafe('./nonexistent/image.png')).rejects.toThrowError()
  })

  it('rejects unsupported image formats with actionable error', async () => {
    const invalid = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x61]).buffer
    await expect(encode(invalid)).rejects.toThrowError(/supported formats are PNG, JPEG, and WebP/i)
  })
})

import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
