import { describe, expect, it, vi } from 'vitest'

describe('blurkit deno wasm codecs dependency UX', () => {
  it('loads module before first call and fails with actionable missing-codecs error at runtime', async () => {
    vi.resetModules()
    vi.doMock('blurkit-wasm-codecs', () => {
      throw Object.assign(new Error('Cannot find package "blurkit-wasm-codecs"'), {
        code: 'ERR_MODULE_NOT_FOUND',
      })
    })

    const mod = await import('../src/deno')
    expect(typeof mod.encode).toBe('function')

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: 'BLURKIT_MISSING_WASM_CODECS',
    })

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toThrowError(/blurkit-wasm-codecs/i)

    vi.doUnmock('blurkit-wasm-codecs')
    vi.resetModules()
  })
})
