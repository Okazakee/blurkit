import { afterEach, describe, expect, it, vi } from 'vitest'

// SAFETY: expose optional global API slots so the test can install and remove stubs.
const globals = globalThis as { ImageDecoder?: unknown; OffscreenCanvas?: unknown }

const originalImageDecoder = globals.ImageDecoder
const originalOffscreenCanvas = globals.OffscreenCanvas

function mockMissingCodecsPackage(): void {
  // oxlint-disable-next-line anti-slop/no-module-mocking -- simulates the optional blurkit-wasm-codecs package being absent to verify BLURKIT_MISSING_WASM_CODECS.
  vi.doMock('blurkit-wasm-codecs', () => {
    const error = Object.assign(new Error('Cannot find package "blurkit-wasm-codecs"'), {
      code: 'ERR_MODULE_NOT_FOUND',
    })
    throw error
  })
}

afterEach(() => {
  vi.doUnmock('blurkit-wasm-codecs')
  vi.resetModules()
  globals.ImageDecoder = originalImageDecoder
  globals.OffscreenCanvas = originalOffscreenCanvas
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

    globals.ImageDecoder = undefined
    globals.OffscreenCanvas = undefined

    const mod = await import('../src/edge')

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: 'BLURKIT_MISSING_WASM_CODECS',
    })

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toThrowError(/pnpm add blurkit-wasm-codecs/i)
  })
})
