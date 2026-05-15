import { afterEach, describe, expect, it, vi } from 'vitest'

const originalImageDecoder = (globalThis as { ImageDecoder?: unknown }).ImageDecoder
const originalOffscreenCanvas = (globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas

function mockMissingCodecsPackage(): void {
  vi.doMock('blurkit-wasm-codecs', () => {
    const error = new Error('Cannot find package "blurkit-wasm-codecs"') as Error & { code?: string }
    error.code = 'ERR_MODULE_NOT_FOUND'
    throw error
  })
}

afterEach(() => {
  vi.doUnmock('blurkit-wasm-codecs')
  vi.resetModules()
  ;(globalThis as { ImageDecoder?: unknown }).ImageDecoder = originalImageDecoder
  ;(globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas = originalOffscreenCanvas
})

describe('blurkit wasm codec dependency UX', () => {
  it('throws actionable BLURKIT_MISSING_WASM_CODECS in blurkit/wasm', async () => {
    vi.resetModules()
    mockMissingCodecsPackage()

    const mod = await import('../src/wasm')

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: 'BLURKIT_MISSING_WASM_CODECS',
    })

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toThrowError(/npm install blurkit-wasm-codecs/i)
  })

  it('throws actionable BLURKIT_MISSING_WASM_CODECS in blurkit/edge fallback path', async () => {
    vi.resetModules()
    mockMissingCodecsPackage()

    ;(globalThis as { ImageDecoder?: unknown }).ImageDecoder = undefined
    ;(globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas = undefined

    const mod = await import('../src/edge')

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: 'BLURKIT_MISSING_WASM_CODECS',
    })

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toThrowError(/pnpm add blurkit-wasm-codecs/i)
  })
})
