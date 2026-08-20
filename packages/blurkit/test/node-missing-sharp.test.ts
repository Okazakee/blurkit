import { describe, expect, it, vi } from 'vitest'

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- type guard must accept any value to narrow it.
function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

describe('blurkit node sharp dependency UX', () => {
  it('loads module before first call and fails with actionable missing-sharp error at runtime', async () => {
    vi.resetModules()
    // oxlint-disable-next-line anti-slop/no-module-mocking -- simulates the optional sharp package being absent to verify BLURKIT_MISSING_SHARP.
    vi.doMock('sharp', () => {
      throw new Error('Cannot find package "sharp" imported from blurkit/node')
    })

    const mod = await import('../src/node')
    expect(isFunction(mod.encode)).toBe(true)

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: 'BLURKIT_MISSING_SHARP',
    })

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toThrowError(/npm install sharp/i)

    vi.doUnmock('sharp')
    vi.resetModules()
  })
})
