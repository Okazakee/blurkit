import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'

import { encode } from '../src/edge'

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

const originalImageDecoder = (globalThis as { ImageDecoder?: unknown }).ImageDecoder
const originalOffscreenCanvas = (globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas
const originalImageData = (globalThis as { ImageData?: unknown }).ImageData

afterEach(() => {
  ;(globalThis as { ImageDecoder?: unknown }).ImageDecoder = originalImageDecoder
  ;(globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas = originalOffscreenCanvas
  ;(globalThis as { ImageData?: unknown }).ImageData = originalImageData
})

describe('blurkit edge runtime', () => {
  it('falls back to wasm when native APIs are unavailable', async () => {
    const image = await sharp({
      create: {
        width: 18,
        height: 12,
        channels: 4,
        background: { r: 50, g: 180, b: 120, alpha: 0.8 },
      },
    }).png().toBuffer()

    const result = await encode(toArrayBuffer(image), { size: 9 })

    expect(result.dataURL.startsWith('data:image/')).toBe(true)
    expect(result.width).toBe(9)
    expect(result.height).toBe(6)
    expect(result.meta.originalWidth).toBe(18)
    expect(result.meta.originalHeight).toBe(12)
  })

  it('uses native path when ImageDecoder and OffscreenCanvas are available', async () => {
    class FakeImageData {
      data: Uint8ClampedArray
      width: number
      height: number

      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data
        this.width = width
        this.height = height
      }
    }

    class FakeImageDecoder {
      constructor(_options: unknown) {}

      async decode(): Promise<{ image: { displayWidth: number; displayHeight: number } }> {
        return {
          image: {
            displayWidth: 4,
            displayHeight: 2,
          },
        }
      }

      close(): void {}
    }

    class FakeOffscreenCanvas {
      width: number
      height: number

      constructor(width: number, height: number) {
        this.width = width
        this.height = height
      }

      getContext(_type: string): {
        drawImage: (..._args: unknown[]) => void
        getImageData: (_x: number, _y: number, width: number, height: number) => { data: Uint8ClampedArray }
        putImageData: (..._args: unknown[]) => void
      } {
        return {
          drawImage: () => {},
          getImageData: (_x, _y, width, height) => ({
            data: new Uint8ClampedArray(width * height * 4).fill(255),
          }),
          putImageData: () => {},
        }
      }

      async convertToBlob(options: { type: string }): Promise<Blob> {
        return new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: options.type })
      }
    }

    ;(globalThis as { ImageData?: unknown }).ImageData = FakeImageData
    ;(globalThis as { ImageDecoder?: unknown }).ImageDecoder = FakeImageDecoder
    ;(globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas = FakeOffscreenCanvas

    const png = await sharp({
      create: {
        width: 4,
        height: 2,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer()

    const blobData = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer
    const result = await encode(new Blob([blobData], { type: 'image/png' }), { width: 4, height: 2 })

    expect(result.width).toBe(4)
    expect(result.height).toBe(2)
    expect(result.meta.originalWidth).toBe(4)
    expect(result.meta.originalHeight).toBe(2)
  })

  it('rejects non-remote string input', async () => {
    const encodeUnsafe = encode as (input: string) => Promise<unknown>
    await expect(encodeUnsafe('./images/hero.jpg')).rejects.toThrowError(/supports remote URLs/i)
  })
})
