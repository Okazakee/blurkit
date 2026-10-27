import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCloudflareCache, encode, encodeMany, encodeManySettled } from '../src/cloudflare'
import { readImageDimensions } from '../src/internal/image-size'
import type { BlurKitRemoteURLString } from '../src/types'

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

interface CfImageConfig {
  width?: number
  height?: number
  fit?: string
  format?: string
}

interface CfRequestInit extends RequestInit {
  cf?: { image?: CfImageConfig }
}

function pngBytes(width: number, height: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(33)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  const view = new DataView(bytes.buffer)
  view.setUint32(8, 13)
  bytes.set([0x49, 0x48, 0x44, 0x52], 12)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return bytes
}

function jpegBytes(width: number, height: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(24)
  bytes.set([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08], 0)
  bytes[7] = (height >> 8) & 0xff
  bytes[8] = height & 0xff
  bytes[9] = (width >> 8) & 0xff
  bytes[10] = width & 0xff
  return bytes
}

function mockCloudflareFetch(
  handler: (url: string, init: CfRequestInit | undefined) => Response | Promise<Response>,
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    // SAFETY: these tests only pass Cloudflare request init objects, which
    // carry the proprietary `cf.image` extension we need to inspect.
    const cfInit = init as CfRequestInit | undefined
    return Promise.resolve(handler(String(input), cfInit))
  })
}

function imageInfo(width: number, height: number): Response {
  return new Response(JSON.stringify({ width, height, format: 'jpeg' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function imageResponse(bytes: Uint8Array<ArrayBuffer>, type = 'image/png'): Response {
  return new Response(bytes, { status: 200, headers: { 'content-type': type } })
}

function installMockCaches(): void {
  const namespaces = new Map<string, MemoryWorkerCache>()

  // SAFETY: the literal object implements the CacheStorage open contract for this test.
  const cacheStorage = {
    open: async (name: string) => {
      if (!namespaces.has(name)) {
        namespaces.set(name, new MemoryWorkerCache())
      }
      // SAFETY: MemoryWorkerCache implements the Cache match/put contract
      // used by createCloudflareCache; the unknown bridge spans the unused
      // Cache members (add/addAll/delete/keys/matchAll).
      const cache = namespaces.get(name)! as unknown
      // SAFETY: narrowing the bridged value to the Cache contract used by the runtime.
      return cache as Cache
    },
  } as CacheStorage

  // SAFETY: globalThis may not expose caches in this test environment; cast to the optional CacheStorage slot.
  const cachesGlobal = globalThis as { caches?: CacheStorage }
  cachesGlobal.caches = cacheStorage
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
    // Content-aware cache keys hash the transformed bytes, so the same URL is
    // fetched on each encode to prove the bytes are unchanged.
    expect(fetchSpy).toHaveBeenCalledTimes(4)
  })

  it('does not serve stale cached results when URL content changes', async () => {
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
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ width: 128, height: 64, format: 'jpeg' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from([90, 80, 70, 60]), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      )

    const cache = createCloudflareCache({ name: 'test-cache', ttlSeconds: 60 })

    const first = await encode('https://example.com/changing.jpg', {
      cache,
      size: 16,
    })

    const second = await encode('https://example.com/changing.jpg', {
      cache,
      size: 16,
    })

    expect(second.hash).not.toBe(first.hash)
    expect(second.dataURL).not.toBe(first.dataURL)
    expect(fetchSpy).toHaveBeenCalledTimes(4)
  })
})


describe('cloudflare settled batches', () => {
  it('returns fulfilled results for valid inputs in input order', async () => {
    installMockCaches()

    mockCloudflareFetch((url, init) =>
      init?.cf?.image?.format === 'json'
        ? imageInfo(200, 100)
        : imageResponse(pngBytes(url.endsWith('a.jpg') ? 20 : 40, 10)),
    )

    const inputs: Array<BlurKitRemoteURLString | URL> = [
      'https://example.com/a.jpg',
      new URL('https://example.com/b.jpg'),
    ]
    const settled = await encodeManySettled(inputs)

    expect(settled).toHaveLength(2)
    expect(settled[0]?.status).toBe('fulfilled')
    expect(settled[1]?.status).toBe('fulfilled')
    expect(settled[0]?.input).toBe(inputs[0])
    expect(settled[1]?.input).toBe(inputs[1])

    if (settled[0]?.status === 'fulfilled') {
      expect(settled[0].value.width).toBe(20)
    }
    if (settled[1]?.status === 'fulfilled') {
      expect(settled[1].value.width).toBe(40)
    }
  })

  it('keeps invalid inputs as per-item rejections instead of rejecting the batch', async () => {
    installMockCaches()

    mockCloudflareFetch((_url, init) =>
      init?.cf?.image?.format === 'json' ? imageInfo(200, 100) : imageResponse(pngBytes(20, 10)),
    )

    // SAFETY: the test deliberately passes non-remote inputs to prove the
    // runtime turns them into per-item rejections; the public overload only
    // advertises remote URLs.
    const inputs = ['https://example.com/a.jpg', './local.jpg', 'https://example.com/c.jpg'] as BlurKitRemoteURLString[]
    const settled = await encodeManySettled(inputs)

    expect(settled.map((entry) => entry.status)).toEqual(['fulfilled', 'rejected', 'fulfilled'])
    expect(settled.map((entry) => entry.input)).toEqual(inputs)

    const rejected = settled[1]
    expect(rejected?.status).toBe('rejected')
    if (rejected?.status === 'rejected') {
      expect(String(rejected.reason)).toMatch(/only remote http\(s\) URL/i)
    }
  })

  it('records transform failures without failing successful entries', async () => {
    installMockCaches()

    mockCloudflareFetch((url, init) => {
      if (init?.cf?.image?.format === 'json') {
        return imageInfo(200, 100)
      }

      if (url.endsWith('broken.jpg')) {
        return new Response('nope', { status: 502, statusText: 'Bad Gateway' })
      }

      return imageResponse(pngBytes(20, 10))
    })

    const settled = await encodeManySettled([
      'https://example.com/ok.jpg',
      'https://example.com/broken.jpg',
    ])

    expect(settled[0]?.status).toBe('fulfilled')
    expect(settled[1]?.status).toBe('rejected')
    if (settled[1]?.status === 'rejected') {
      expect(String(settled[1].reason)).toMatch(/Failed to transform image via Cloudflare/i)
    }
  })

  it('reports multiple failures without throwing', async () => {
    installMockCaches()

    mockCloudflareFetch((_url, init) =>
      init?.cf?.image?.format === 'json' ? imageInfo(200, 100) : imageResponse(pngBytes(20, 10)),
    )

    // SAFETY: same as above - invalid inputs are the point of this test.
    const mixed = ['./one.jpg', 'blob:not-remote', 'https://example.com/ok.jpg'] as BlurKitRemoteURLString[]
    const settled = await encodeManySettled(mixed)

    expect(settled.map((entry) => entry.status)).toEqual(['rejected', 'rejected', 'fulfilled'])
  })

  it('keeps encodeMany fail-fast', async () => {
    installMockCaches()

    mockCloudflareFetch((_url, init) =>
      init?.cf?.image?.format === 'json' ? imageInfo(200, 100) : imageResponse(pngBytes(20, 10)),
    )

    // SAFETY: invalid input is intentional; encodeMany must still fail fast.
    const mixed = ['https://example.com/a.jpg', './local.jpg'] as BlurKitRemoteURLString[]

    await expect(encodeMany(mixed)).rejects.toThrowError(/only remote http\(s\) URL/i)
  })
})

describe('cloudflare result dimensions', () => {
  it('reports the transformed PNG dimensions when they differ from the request', async () => {
    installMockCaches()

    mockCloudflareFetch((_url, init) =>
      init?.cf?.image?.format === 'json' ? imageInfo(400, 200) : imageResponse(pngBytes(16, 8)),
    )

    const result = await encode('https://example.com/image.png', { size: 64 })

    expect({ width: result.width, height: result.height }).toEqual({ width: 16, height: 8 })
  })

  it('reads JPEG dimensions and handles sources smaller than the target', async () => {
    installMockCaches()

    mockCloudflareFetch((_url, init) =>
      init?.cf?.image?.format === 'json' ? imageInfo(20, 10) : imageResponse(jpegBytes(20, 10), 'image/jpeg'),
    )

    const result = await encode('https://example.com/small.jpg', { size: 128 })

    expect({ width: result.width, height: result.height }).toEqual({ width: 20, height: 10 })
  })

  it('honours explicit width and height in the request box', async () => {
    installMockCaches()

    let requested: CfImageConfig = {}

    mockCloudflareFetch((_url, init) => {
      if (init?.cf?.image?.format === 'json') {
        return imageInfo(200, 100)
      }

      requested = init?.cf?.image ?? {}
      return imageResponse(pngBytes(40, 20))
    })

    const result = await encode('https://example.com/image.jpg', { width: 40, height: 20 })

    expect(requested).toMatchObject({ width: 40, height: 20, fit: 'scale-down' })
    expect({ width: result.width, height: result.height }).toEqual({ width: 40, height: 20 })
  })

  it('falls back to the requested box and source metadata when info is missing', async () => {
    installMockCaches()

    mockCloudflareFetch((_url, init) =>
      init?.cf?.image?.format === 'json'
        ? new Response('not-json', { status: 200, headers: { 'content-type': 'text/html' } })
        : imageResponse(pngBytes(32, 32)),
    )

    const result = await encode('https://example.com/image.jpg', { size: 32 })

    expect({ width: result.width, height: result.height }).toEqual({ width: 32, height: 32 })
    expect(result.meta.originalWidth).toBe(32)
    expect(result.meta.originalHeight).toBe(32)
  })

  it('keeps the requested box when the bytes are not a readable image', async () => {
    installMockCaches()

    mockCloudflareFetch((_url, init) =>
      init?.cf?.image?.format === 'json' ? imageInfo(200, 100) : imageResponse(Uint8Array.from([1, 2, 3, 4])),
    )

    const result = await encode('https://example.com/image.jpg', { size: 32 })

    expect({ width: result.width, height: result.height }).toEqual({ width: 32, height: 16 })
  })
})

describe('image-size reader', () => {
  it('returns undefined for unknown or truncated payloads', () => {
    expect(readImageDimensions(new Uint8Array())).toBeUndefined()
    expect(readImageDimensions(Uint8Array.from([0x89, 0x50]))).toBeUndefined()
    expect(readImageDimensions(Uint8Array.from([0xff, 0xd8]))).toBeUndefined()
    expect(readImageDimensions(Uint8Array.from([1, 2, 3, 4]))).toBeUndefined()
  })

  it('reads PNG and JPEG headers', () => {
    expect(readImageDimensions(pngBytes(3, 7))).toEqual({ width: 3, height: 7 })
    expect(readImageDimensions(jpegBytes(12, 9))).toEqual({ width: 12, height: 9 })
  })
})
