import { describe, expect, it, vi } from 'vitest'

import { encode } from '../src/browser'

describe('blurkit browser runtime', () => {
  it('rejects local filesystem path strings with actionable message', async () => {
    const encodeUnsafe = encode as (input: string) => Promise<unknown>
    await expect(encodeUnsafe('./images/hero.jpg')).rejects.toThrowError(
      /File, Blob, ArrayBuffer, or a remote http\(s\) URL/i,
    )
  })

  it('accepts remote URL input shape and fails fetch with transport error when unavailable', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('not found', { status: 404, statusText: 'Not Found' }))

    await expect(encode('https://example.com/hero.jpg')).rejects.toThrowError(/Failed to fetch remote image: 404/i)

    fetchSpy.mockRestore()
  })
})
