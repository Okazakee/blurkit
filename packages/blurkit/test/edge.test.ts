import { describe, expect, it } from 'vitest'

import { encode } from '../src/edge'

describe('blurkit edge runtime', () => {
  it('fails fast with actionable runtime capability guidance', async () => {
    await expect(encode(new ArrayBuffer(8))).rejects.toThrowError(
      /blurkit\/cloudflare|ImageDecoder|OffscreenCanvas/i,
    )
  })

  it('rejects non-remote string input', async () => {
    const encodeUnsafe = encode as (input: string) => Promise<unknown>
    await expect(encodeUnsafe('./images/hero.jpg')).rejects.toThrowError(/supports remote URLs/i)
  })
})
