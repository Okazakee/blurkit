import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { createMemoryCache, encode, encodeMany } from '../src/node'

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
})
