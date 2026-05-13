import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import {
  createFilesystemCache,
  createMemoryCache,
  encode,
  encodeMany,
  encodeManySettled,
} from '../src/node'

function toOwnedArrayBuffer(buffer: Buffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

describe('blurkit node runtime', () => {
  it('encodes a blurhash placeholder data URL', async () => {
    const image = await sharp({
      create: {
        width: 64,
        height: 32,
        channels: 4,
        background: { r: 230, g: 120, b: 70, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    const result = await encode(toOwnedArrayBuffer(image), {
      size: 24,
      cache: createMemoryCache(),
    })

    expect(result.algorithm).toBe('blurhash')
    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true)
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
    expect(result.meta?.originalWidth).toBe(64)
    expect(result.meta?.originalHeight).toBe(32)
  })

  it('encodes multiple thumbhash placeholders', async () => {
    const first = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 50, g: 90, b: 210, alpha: 1 },
      },
    })
      .png()
      .toBuffer()
    const second = await sharp({
      create: {
        width: 32,
        height: 16,
        channels: 4,
        background: { r: 120, g: 220, b: 120, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer()

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
    const valid = await sharp({
      create: {
        width: 24,
        height: 24,
        channels: 4,
        background: { r: 20, g: 160, b: 240, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

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

    const image = await sharp({
      create: {
        width: 12,
        height: 12,
        channels: 4,
        background: { r: 180, g: 180, b: 180, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

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
})
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
