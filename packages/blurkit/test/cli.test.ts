import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { encodePath } from '../src/cli'
import type { BlurResult } from '../src/types'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('blurkit CLI backend selection', () => {
  it('uses sharp backend by default for local files', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'blurkit-cli-sharp-'))

    try {
      const filePath = path.join(dir, 'source.png')
      const image = await sharp({
        create: {
          width: 20,
          height: 10,
          channels: 4,
          background: { r: 120, g: 20, b: 190, alpha: 1 },
        },
      }).png().toBuffer()
      await writeFile(filePath, image)

      const result = await encodePath(filePath, { size: '10' }) as BlurResult

      expect(result.width).toBe(10)
      expect(result.height).toBe(5)
      expect(result.dataURL.startsWith('data:image/')).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('uses wasm backend for local files when requested', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'blurkit-cli-wasm-local-'))

    try {
      const filePath = path.join(dir, 'source.webp')
      const image = await sharp({
        create: {
          width: 24,
          height: 12,
          channels: 4,
          background: { r: 25, g: 190, b: 80, alpha: 1 },
        },
      }).webp().toBuffer()
      await writeFile(filePath, image)

      const result = await encodePath(filePath, { backend: 'wasm', size: '12' }) as BlurResult

      expect(result.width).toBe(12)
      expect(result.height).toBe(6)
      expect(result.meta.originalWidth).toBe(24)
      expect(result.meta.originalHeight).toBe(12)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('uses wasm backend for remote URLs when requested', async () => {
    const image = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 4,
        background: { r: 210, g: 90, b: 20, alpha: 1 },
      },
    }).png().toBuffer()

    const body = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength) as ArrayBuffer
    globalThis.fetch = vi.fn(async () => new Response(body, {
      status: 200,
      headers: {
        'content-type': 'image/png',
      },
    })) as typeof fetch

    const result = await encodePath('https://example.com/image.png', {
      backend: 'wasm',
      size: '8',
    }) as BlurResult

    expect(result.width).toBe(8)
    expect(result.height).toBe(8)
    expect(result.hash.length).toBeGreaterThan(10)
  })

  it('rejects unsupported backend names', async () => {
    await expect(
      encodePath('https://example.com/image.png', {
        backend: 'canvas',
      }),
    ).rejects.toThrowError(/Unsupported backend/i)
  })
})
