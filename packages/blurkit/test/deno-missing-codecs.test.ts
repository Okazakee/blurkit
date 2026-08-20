import { describe, expect, it, vi } from 'vitest'

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- type guard must accept any value to narrow it.
function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

describe('blurkit deno wasm codecs dependency UX', () => {
  it('loads module before first call and fails with actionable missing-codecs error at runtime', async () => {
    vi.resetModules()
    // oxlint-disable-next-line anti-slop/no-module-mocking -- simulates the optional blurkit-wasm-codecs package being absent to verify BLURKIT_MISSING_WASM_CODECS.
    vi.doMock('blurkit-wasm-codecs', () => {
      throw Object.assign(new Error('Cannot find package "blurkit-wasm-codecs"'), {
        code: 'ERR_MODULE_NOT_FOUND',
      })
    })

    const mod = await import('../src/deno')
    expect(isFunction(mod.encode)).toBe(true)

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: 'BLURKIT_MISSING_WASM_CODECS',
    })

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toThrowError(/blurkit-wasm-codecs/i)

    vi.doUnmock('blurkit-wasm-codecs')
    vi.resetModules()
  })
})
