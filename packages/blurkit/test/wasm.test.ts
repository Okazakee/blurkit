import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { encode } from '../src/wasm'

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

describe('blurkit wasm runtime', () => {
  it('encodes PNG, JPEG, and WebP inputs', async () => {
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
      expect(result.meta?.originalWidth).toBe(24)
      expect(result.meta?.originalHeight).toBe(16)
    }
  })

  it('returns deterministic hash values for the same input', async () => {
    const input = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 80, b: 90, alpha: 1 },
      },
    }).png().toBuffer()

    const first = await encode(toArrayBuffer(input), { algorithm: 'thumbhash', size: 10 })
    const second = await encode(toArrayBuffer(input), { algorithm: 'thumbhash', size: 10 })

    expect(first.hash).toBe(second.hash)
    expect(first.dataURL).toBe(second.dataURL)
  })

  it('rejects unsupported formats with actionable guidance', async () => {
    const invalid = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x61]).buffer
    await expect(encode(invalid)).rejects.toThrowError(/supported formats are PNG, JPEG, and WebP/i)
  })

  it('rejects local path input strings', async () => {
    const encodeUnsafe = encode as (input: string) => Promise<unknown>
    await expect(encodeUnsafe('./images/hero.jpg')).rejects.toThrowError(
      /supports remote URLs, Blob, and ArrayBuffer input only/i,
    )
  })
})
