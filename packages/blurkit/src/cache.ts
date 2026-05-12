import type { BlurKitCache, BlurResult } from './types'

export function createMemoryCache(options: { max?: number } = {}): BlurKitCache {
  const max = Math.max(1, options.max ?? 500)
  const cache = new Map<string, BlurResult>()

  return {
    get(key) {
      const value = cache.get(key)
      if (!value) {
        return undefined
      }

      cache.delete(key)
      cache.set(key, value)
      return value
    },
    set(key, value) {
      if (cache.has(key)) {
        cache.delete(key)
      }

      cache.set(key, value)

      if (cache.size > max) {
        const oldestKey = cache.keys().next().value
        if (oldestKey) {
          cache.delete(oldestKey)
        }
      }
    },
  }
}

