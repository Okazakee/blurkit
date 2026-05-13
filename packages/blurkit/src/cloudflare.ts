import { resolveTargetDimensions } from './internal/dimensions'
import { normalizeOptions } from './internal/normalize-options'
import { bytesToDataURL } from './internal/base64'
import { createCacheKey } from './internal/cache-key'
import type {
  BlurEncodeManySettledResult,
  BlurKitCache,
  BlurKitInput,
  BlurKitOptions,
  BlurKitRemoteURLString,
  BlurResult,
} from './types'

interface CloudflareImageInfo {
  originalWidth?: number
  originalHeight?: number
  format?: string
}

function isRemoteURLInput(input: BlurKitInput): input is BlurKitRemoteURLString | URL {
  return (typeof input === 'string' && /^https?:\/\//i.test(input)) || input instanceof URL
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function createSyntheticHash(bytes: Uint8Array, algorithm: 'blurhash' | 'thumbhash'): Promise<string> {
  const digestInput = new Uint8Array(bytes.byteLength)
  digestInput.set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', digestInput)
  const prefix = algorithm === 'blurhash' ? 'cfbh' : 'cfth'
  return `${prefix}:${toHex(new Uint8Array(digest)).slice(0, 32)}`
}

function readOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function readCloudflareInfo(value: unknown): CloudflareImageInfo {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const payload = value as Record<string, unknown>
  return {
    originalWidth:
      readOptionalNumber(payload.originalWidth) ??
      readOptionalNumber(payload.inputWidth) ??
      readOptionalNumber(payload.width),
    originalHeight:
      readOptionalNumber(payload.originalHeight) ??
      readOptionalNumber(payload.inputHeight) ??
      readOptionalNumber(payload.height),
    format:
      typeof payload.format === 'string'
        ? payload.format
        : typeof payload.inputFormat === 'string'
          ? payload.inputFormat
          : undefined,
  }
}

async function fetchCloudflareImageInfo(url: string): Promise<CloudflareImageInfo> {
  const response = await fetch(
    url,
    ({
      cf: {
        image: {
          format: 'json',
          anim: false,
        },
      },
    } as RequestInit),
  )

  if (!response.ok) {
    return {}
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return {}
  }

  try {
    const json = (await response.json()) as unknown
    return readCloudflareInfo(json)
  } catch {
    return {}
  }
}

async function resolveCloudflareTarget(
  url: string,
  options: ReturnType<typeof normalizeOptions>,
): Promise<{ width: number; height: number; info: CloudflareImageInfo }> {
  const info = await fetchCloudflareImageInfo(url)

  if (options.width && options.height) {
    return {
      width: options.width,
      height: options.height,
      info,
    }
  }

  if (info.originalWidth && info.originalHeight) {
    const target = resolveTargetDimensions(info.originalWidth, info.originalHeight, options)
    return {
      width: target.width,
      height: target.height,
      info,
    }
  }

  return {
    width: options.size,
    height: options.size,
    info,
  }
}

async function encodeRemoteURL(
  url: string,
  options: ReturnType<typeof normalizeOptions>,
): Promise<BlurResult> {
  const target = await resolveCloudflareTarget(url, options)

  const response = await fetch(
    url,
    ({
      cf: {
        image: {
          width: target.width,
          height: target.height,
          fit: 'scale-down',
          format: options.outputFormat,
          anim: false,
        },
      },
    } as RequestInit),
  )

  if (!response.ok) {
    throw new Error(`Failed to transform image via Cloudflare: ${response.status} ${response.statusText}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const mimeType = response.headers.get('content-type') ?? `image/${options.outputFormat}`

  return {
    dataURL: bytesToDataURL(bytes, mimeType),
    hash: await createSyntheticHash(bytes, options.algorithm),
    algorithm: options.algorithm,
    width: target.width,
    height: target.height,
    meta: {
      originalWidth: target.info.originalWidth ?? target.width,
      originalHeight: target.info.originalHeight ?? target.height,
      format: target.info.format,
      hasAlpha: undefined,
    },
  }
}

async function encodeWithCache(
  input: BlurKitInput,
  options: ReturnType<typeof normalizeOptions>,
): Promise<BlurResult> {
  const identifier = input instanceof URL ? input.toString() : String(input)
  const cacheKey = options.cache
    ? await createCacheKey(input, identifier, options)
    : undefined

  if (options.cache && cacheKey) {
    const cached = await options.cache.get(cacheKey)
    if (cached) {
      return cached
    }
  }

  const result = await encodeRemoteURL(identifier, options)

  if (options.cache && cacheKey) {
    await options.cache.set(cacheKey, result)
  }

  return result
}

export async function encode(
  input: BlurKitRemoteURLString | URL,
  options?: BlurKitOptions,
): Promise<BlurResult>
export async function encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult> {
  if (!isRemoteURLInput(input)) {
    throw new Error('blurkit/cloudflare supports only remote http(s) URL string or URL input.')
  }

  return encodeWithCache(input, normalizeOptions(options))
}

export async function encodeMany(
  inputs: Array<BlurKitRemoteURLString | URL>,
  options?: BlurKitOptions,
): Promise<BlurResult[]>
export async function encodeMany(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]> {
  const normalized = normalizeOptions(options)
  return Promise.all(
    inputs.map((input) => {
      if (!isRemoteURLInput(input)) {
        throw new Error('blurkit/cloudflare supports only remote http(s) URL string or URL input.')
      }

      return encodeWithCache(input, normalized)
    }),
  )
}

export async function encodeManySettled(
  inputs: Array<BlurKitRemoteURLString | URL>,
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]>
export async function encodeManySettled(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]> {
  const normalized = normalizeOptions(options)
  const settled = await Promise.allSettled(
    inputs.map((input) => {
      if (!isRemoteURLInput(input)) {
        throw new Error('blurkit/cloudflare supports only remote http(s) URL string or URL input.')
      }

      return encodeWithCache(input, normalized)
    }),
  )

  return settled.map((result, index) => {
    const input = inputs[index]!

    if (result.status === 'fulfilled') {
      return {
        status: 'fulfilled',
        input,
        value: result.value,
      }
    }

    return {
      status: 'rejected',
      input,
      reason: result.reason,
    }
  })
}

interface CloudflareCacheEnvelope {
  expiresAt?: number
  value: BlurResult
}

function createCacheRequest(cacheName: string, key: string): Request {
  return new Request(`https://blurkit.cache/${cacheName}/${encodeURIComponent(key)}`)
}

export function createCloudflareCache(options: {
  name?: string
  ttlSeconds?: number
} = {}): BlurKitCache {
  const name = options.name ?? 'blurkit'
  const ttlSeconds = options.ttlSeconds

  return {
    async get(key) {
      const request = createCacheRequest(name, key)
      const cache = await caches.open(name)
      const response = await cache.match(request)

      if (!response) {
        return undefined
      }

      try {
        const payload = (await response.json()) as CloudflareCacheEnvelope
        if (payload.expiresAt && Date.now() > payload.expiresAt) {
          return undefined
        }
        return payload.value
      } catch {
        return undefined
      }
    },
    async set(key, value) {
      const request = createCacheRequest(name, key)
      const cache = await caches.open(name)
      const payload: CloudflareCacheEnvelope = {
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
        value,
      }

      const headers = new Headers({
        'content-type': 'application/json',
      })

      if (ttlSeconds) {
        headers.set('cache-control', `public, max-age=${ttlSeconds}`)
      }

      await cache.put(
        request,
        new Response(JSON.stringify(payload), {
          headers,
        }),
      )
    },
  }
}
