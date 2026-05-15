import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('package export map and root import smoke checks', () => {
  it('uses static conditional exports for root import', async () => {
    const packageJsonPath = path.resolve(__dirname, '../package.json')
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>
    }

    const rootExport = packageJson.exports?.['.'] as Record<string, unknown>

    expect(rootExport).toBeTruthy()
    expect(rootExport).toHaveProperty('browser')
    expect(rootExport).toHaveProperty('node')
    expect(rootExport).toHaveProperty('worker')
    expect(packageJson.exports).toHaveProperty('./wasm')
  })

  it('root source does not dynamically detect runtime', async () => {
    const indexPath = path.resolve(__dirname, '../src/index.ts')
    const source = await readFile(indexPath, 'utf8')

    expect(source.includes('runtimeEntrypoints')).toBe(false)
    expect(source.includes('import(specifier)')).toBe(false)
    expect(source.includes('isBrowserRuntime')).toBe(false)
  })
})
