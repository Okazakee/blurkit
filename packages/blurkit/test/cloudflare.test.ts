import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCloudflareCache, encode } from '../src/cloudflare'

class MemoryWorkerCache {
  private readonly store = new Map<string, Response>()

  async match(request: Request): Promise<Response | undefined> {
    const key = request.url
    const response = this.store.get(key)
    return response ? response.clone() : undefined
  }

  async put(request: Request, response: Response): Promise<void> {
    this.store.set(request.url, response.clone())
  }
}

function installMockCaches(): void {
  const namespaces = new Map<string, MemoryWorkerCache>()

  ;(globalThis as { caches?: CacheStorage }).caches = {
    open: async (name: string) => {
      if (!namespaces.has(name)) {
        namespaces.set(name, new MemoryWorkerCache())
      }
      return namespaces.get(name)! as unknown as Cache
    },
  } as CacheStorage
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('blurkit cloudflare runtime', () => {
  it('encodes via cloudflare transform and returns blur result shape', async () => {
    installMockCaches()

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ width: 200, height: 100, format: 'jpeg' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from([1, 2, 3, 4]), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      )

    const result = await encode('https://example.com/image.jpg')

    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true)
    expect(result.hash.startsWith('cfbh:')).toBe(true)
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('surfaces transform failures', async () => {
    installMockCaches()

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ width: 200, height: 100, format: 'jpeg' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response('nope', {
          status: 502,
          statusText: 'Bad Gateway',
        }),
      )

    await expect(encode('https://example.com/image.jpg')).rejects.toThrowError(/Failed to transform image via Cloudflare/i)
  })

  it('supports worker cache helper for repeated calls', async () => {
    installMockCaches()

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ width: 128, height: 64, format: 'jpeg' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from([10, 20, 30, 40]), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      )

    const cache = createCloudflareCache({ name: 'test-cache', ttlSeconds: 60 })

    const first = await encode('https://example.com/cached.jpg', {
      cache,
      size: 16,
    })

    const second = await encode('https://example.com/cached.jpg', {
      cache,
      size: 16,
    })

    expect(first.hash).toBe(second.hash)
    expect(first.dataURL).toBe(second.dataURL)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
