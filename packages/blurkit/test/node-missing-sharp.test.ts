import { describe, expect, it, vi } from 'vitest'

describe('blurkit node sharp dependency UX', () => {
  it('loads module before first call and fails with actionable missing-sharp error at runtime', async () => {
    vi.resetModules()
    vi.doMock('sharp', () => {
      throw new Error('Cannot find package "sharp" imported from blurkit/node')
    })

    const mod = await import('../src/node')
    expect(typeof mod.encode).toBe('function')

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toMatchObject({
      code: 'BLURKIT_MISSING_SHARP',
    })

    await expect(mod.encode(new ArrayBuffer(8))).rejects.toThrowError(/npm install sharp/i)

    vi.doUnmock('sharp')
    vi.resetModules()
  })
})
