#!/usr/bin/env node
/**
 * Real Chromium integration smoke for blurkit/browser.
 *
 * Bundles the built blurkit/browser entrypoint with esbuild, serves it from a
 * tiny static server, and executes real encodes in Chromium through the
 * browser APIs:
 *
 *   - Blob input
 *   - File input
 *   - Uint8Array input
 *   - ArrayBuffer input
 *   - BlurHash output + rendered dataURL + source metadata
 *   - object URL creation/revocation balance (cleanup behavior)
 *
 * Requires the library packages to be built (pnpm build) and a Playwright
 * chromium browser to be installed.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'

import { chromium } from '@playwright/test'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const ESBUILD = path.join(REPO_ROOT, 'node_modules/.bin/esbuild')

const PNG_1X1 = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)

function main() {
  const work = mkdtempSync(path.join(tmpdir(), 'blurkit-browser-smoke-'))
  const entry = path.join(work, 'entry.mjs')
  const bundle = path.join(work, 'browser-bundle.mjs')
  const indexHtml = path.join(work, 'index.html')

  writeFileSync(
    entry,
    `export { encode, encodeMany } from 'blurkit/browser'\n`,
  )

  // Bundle from the built workspace dist (same artifact the package ships).
  execFileSync(
    ESBUILD,
    [entry, '--bundle', '--platform=browser', '--format=esm', `--outfile=${bundle}`],
    { cwd: REPO_ROOT, stdio: 'pipe' },
  )
  const bundleContent = readFileSync(bundle, 'utf8')
  for (const forbidden of ['sharp', 'node:fs', 'fs/promises', 'node:path']) {
    assert.ok(!bundleContent.includes(forbidden), `browser bundle leaks ${forbidden}`)
  }

  const pngBase64 = Buffer.from(PNG_1X1).toString('base64')

  writeFileSync(
    indexHtml,
    `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script type="module">
  window.__browserSmoke = { done: false, error: null, results: null }

  // Instrument object URL lifecycle before any encode happens.
  const created = []
  const revoked = []
  const origCreate = URL.createObjectURL.bind(URL)
  const origRevoke = URL.revokeObjectURL.bind(URL)
  URL.createObjectURL = (blob) => { const url = origCreate(blob); created.push(url); return url }
  URL.revokeObjectURL = (url) => { revoked.push(url); origRevoke(url) }

  import('./browser-bundle.mjs').then(async ({ encode }) => {
    const bytes = Uint8Array.from(atob('${pngBase64}'), (c) => c.charCodeAt(0))

    const run = async (input, label) => {
      const result = await encode(input, { algorithm: 'blurhash', size: 16 })
      return {
        label,
        ok:
          result.algorithm === 'blurhash' &&
          result.dataURL.startsWith('data:image/png;base64,') &&
          result.hash.length > 0 &&
          result.width === 16 &&
          result.height === 16 &&
          result.meta.originalWidth === 1 &&
          result.meta.originalHeight === 1,
        dataURL: result.dataURL,
        hash: result.hash,
        width: result.width,
        height: result.height,
        originalWidth: result.meta.originalWidth,
        originalHeight: result.meta.originalHeight,
      }
    }

    const blobResult = await run(new Blob([bytes], { type: 'image/png' }), 'blob')
    const fileResult = await run(new File([bytes], 'pixel.png', { type: 'image/png' }), 'file')
    const u8Result = await run(new Uint8Array(bytes), 'uint8array')
    const abResult = await run(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), 'arraybuffer')

    const thumb = await encode(new Blob([bytes], { type: 'image/png' }), {
      algorithm: 'thumbhash',
      size: 16,
    })

    window.__browserSmoke = {
      done: true,
      results: [blobResult, fileResult, u8Result, abResult],
      thumbHash: thumb.hash,
      created: created.length,
      revoked: revoked.length,
    }
  }).catch((error) => {
    window.__browserSmoke = { done: true, error: String(error && error.stack || error) }
  })
</script>
</body></html>`,
  )

  const mime = { '.html': 'text/html', '.mjs': 'text/javascript' }
  const server = http.createServer((req, res) => {
    const file = req.url === '/' ? '/index.html' : req.url
    const filePath = path.join(work, path.basename(file))
    const ext = path.extname(filePath)
    res.setHeader('content-type', mime[ext] || 'application/octet-stream')
    res.end(readFileSync(filePath))
  })

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port
      let browser
      try {
        browser = await chromium.launch()
        const page = await browser.newPage()
        await page.goto(`http://127.0.0.1:${port}/`)
        await page.waitForFunction(() => window.__browserSmoke && window.__browserSmoke.done, null, {
          timeout: 30_000,
        })
        const smoke = await page.evaluate(() => window.__browserSmoke)

        assert.ok(!smoke.error, `in-page error: ${smoke.error}`)
        assert.equal(smoke.results.length, 4)
        for (const result of smoke.results) {
          assert.ok(result.ok, `${result.label} encode failed: ${JSON.stringify(result)}`)
          console.log(
            `  browser ${result.label}: blurhash ${result.hash.length} chars, ${result.width}x${result.height} (src ${result.originalWidth}x${result.originalHeight})`,
          )
        }
        assert.ok(smoke.thumbHash.length > 0, 'thumbhash failed')
        assert.ok(smoke.created > 0, 'expected object URL creation')
        assert.equal(smoke.created, smoke.revoked, 'object URLs leaked (created !== revoked)')
        console.log(`  browser object URL cleanup: ${smoke.created} created / ${smoke.revoked} revoked`)
        console.log('\nbrowser smoke: ALL CHECKS PASSED')
        resolve()
      } catch (error) {
        reject(error)
      } finally {
        if (browser) await browser.close()
        server.close()
      }
    })
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
