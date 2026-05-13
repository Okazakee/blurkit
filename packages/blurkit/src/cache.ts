import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

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

interface PersistentCacheEntry {
  storedAt: number
  value: BlurResult
}

function toCacheFilePath(rootDir: string, key: string): string {
  return path.join(rootDir, `${encodeURIComponent(key)}.json`)
}

export function createFilesystemCache(options: {
  dir: string
  ttlMs?: number
}): BlurKitCache {
  const rootDir = path.resolve(options.dir)
  const ttlMs = options.ttlMs

  return {
    async get(key) {
      const filePath = toCacheFilePath(rootDir, key)

      try {
        const raw = await readFile(filePath, 'utf8')
        const parsed = JSON.parse(raw) as PersistentCacheEntry

        if (ttlMs && Date.now() - parsed.storedAt > ttlMs) {
          return undefined
        }

        return parsed.value
      } catch {
        return undefined
      }
    },
    async set(key, value) {
      await mkdir(rootDir, { recursive: true })
      const filePath = toCacheFilePath(rootDir, key)
      const payload: PersistentCacheEntry = {
        storedAt: Date.now(),
        value,
      }
      await writeFile(filePath, JSON.stringify(payload), 'utf8')
    },
  }
}
