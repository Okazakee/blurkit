#!/usr/bin/env node
/**
 * Validates the actual packed artifact shape for blurkit and
 * blurkit-wasm-codecs.
 *
 * Source tests are not enough for universal packages with conditional
 * exports: this script builds, packs, and validates the artifact a user
 * actually installs:
 *
 *   1. `npm pack` both packages and inspect the packed file lists.
 *   2. publint on the packed tarballs (export map / metadata lint).
 *   3. @arethetypeswrong/cli on both packages (export/type resolution).
 *   4. Clean temporary consumers installing the packed tarballs.
 *   5. ESM imports + CJS requires for every advertised entrypoint.
 *   6. TypeScript consumer typecheck against the installed declarations.
 *   7. Module-graph scans: browser/edge/wasm/cloudflare must not pull sharp
 *      or Node natives; node must keep sharp behind a dynamic import.
 *   8. esbuild bundles: browser bundle must not contain sharp; node bundle
 *      must keep the lazy dynamic sharp import.
 *   9. Runtime encode smoke from the packed package (needs sharp installed).
 *
 * Run from the repository root after `pnpm build` for both packages.
 */

import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const BLURKIT_DIR = path.join(REPO_ROOT, 'packages/blurkit')
const CODECS_DIR = path.join(REPO_ROOT, 'packages/blurkit-wasm-codecs')

const ENTRYPOINTS = [
  'blurkit',
  'blurkit/node',
  'blurkit/browser',
  'blurkit/deno',
  'blurkit/edge',
  'blurkit/cloudflare',
  'blurkit/wasm',
]

// Runtime entrypoints that must never statically reference sharp or Node
// natives (per module graph): browser, worker/edge, wasm, cloudflare.
const NO_NATIVE_ENTRIES = [
  'root-browser',
  'root-edge',
  'browser',
  'edge',
  'wasm',
  'cloudflare',
]

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: options.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    ...(options.cwd ? { cwd: options.cwd } : {}),
  })
}

function parsePackOutput(raw) {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) {
    throw new Error(`Unable to parse npm pack --json output: ${raw}`)
  }
  const entries = JSON.parse(raw.slice(start, end + 1))
  return entries[0]
}

function assertPackedFiles(tarball, required, label) {
  const listing = run('tar', ['-tzf', tarball], { quiet: true })
    .split('\n')
    .filter(Boolean)
  const files = listing.map((entry) => entry.replace(/^package\//, ''))

  const missing = required.filter((file) => !files.includes(file))
  if (missing.length > 0) {
    throw new Error(`${label}: packed tarball missing files: ${missing.join(', ')}`)
  }

  const unexpected = files.filter(
    (file) =>
      file.startsWith('src/') ||
      file.startsWith('test/') ||
      file.startsWith('.github/') ||
      file === 'pnpm-lock.yaml',
  )
  if (unexpected.length > 0) {
    throw new Error(`${label}: packed tarball contains unexpected files: ${unexpected.join(', ')}`)
  }

  console.log(`  ${label}: ${files.length} files, required entries present`)
}

function scanForbidden(entryPrefix, dir, forbidden, label) {
  const content = readFileSync(path.join(dir, `${entryPrefix}.js`), 'utf8')
  const hits = forbidden.filter((needle) => content.includes(needle))
  if (hits.length > 0) {
    throw new Error(`${label} (${entryPrefix}.js): forbidden references ${hits.join(', ')}`)
  }
  console.log(`  ${label} (${entryPrefix}.js): clean`)
}

function writeTempFile(dir, name, content) {
  const filePath = path.join(dir, name)
  writeFileSync(filePath, content)
  return filePath
}

function main() {
  const work = mkdtempSync(path.join(tmpdir(), 'blurkit-pack-validate-'))
  console.log(`work dir: ${work}`)

  try {
    const packDir = path.join(work, 'pack')
    mkdirSync(packDir, { recursive: true })

    console.log('\n[1/9] Packing packages')
    const blurkitPack = parsePackOutput(
      run('npm', ['pack', '--json', '--pack-destination', packDir], { cwd: BLURKIT_DIR, quiet: true }),
    )
    const codecsPack = parsePackOutput(
      run('npm', ['pack', '--json', '--pack-destination', packDir], { cwd: CODECS_DIR, quiet: true }),
    )
    const blurkitTarball = path.join(packDir, blurkitPack.filename)
    const codecsTarball = path.join(packDir, codecsPack.filename)
    console.log(`  blurkit: ${blurkitPack.filename}`)
    console.log(`  blurkit-wasm-codecs: ${codecsPack.filename}`)

    console.log('\n[2/9] Inspecting packed file lists')
    const blurkitRequired = [
      'package.json',
      'README.md',
      'dist/index.js',
      'dist/index.cjs',
      'dist/index.d.ts',
      'dist/index.d.cts',
      'dist/node.js',
      'dist/node.cjs',
      'dist/node.d.ts',
      'dist/node.d.cts',
      'dist/browser.js',
      'dist/browser.cjs',
      'dist/browser.d.ts',
      'dist/browser.d.cts',
      'dist/deno.js',
      'dist/deno.cjs',
      'dist/deno.d.ts',
      'dist/deno.d.cts',
      'dist/edge.js',
      'dist/edge.cjs',
      'dist/edge.d.ts',
      'dist/edge.d.cts',
      'dist/cloudflare.js',
      'dist/cloudflare.cjs',
      'dist/cloudflare.d.ts',
      'dist/cloudflare.d.cts',
      'dist/wasm.js',
      'dist/wasm.cjs',
      'dist/wasm.d.ts',
      'dist/wasm.d.cts',
      'dist/cli.cjs',
      'dist/root-node.js',
      'dist/root-node.cjs',
      'dist/root-node.d.ts',
      'dist/root-node.d.cts',
      'dist/root-browser.js',
      'dist/root-browser.cjs',
      'dist/root-browser.d.ts',
      'dist/root-browser.d.cts',
      'dist/root-deno.js',
      'dist/root-deno.cjs',
      'dist/root-deno.d.ts',
      'dist/root-deno.d.cts',
      'dist/root-edge.js',
      'dist/root-edge.cjs',
      'dist/root-edge.d.ts',
      'dist/root-edge.d.cts',
    ]
    const codecsRequired = [
      'package.json',
      'README.md',
      'dist/index.js',
      'dist/index.cjs',
      'dist/index.d.ts',
      'dist/index.d.cts',
    ]
    assertPackedFiles(blurkitTarball, blurkitRequired, 'blurkit')
    assertPackedFiles(codecsTarball, codecsRequired, 'blurkit-wasm-codecs')

    console.log('\n[3/9] publint')
    run('npx', ['--yes', 'publint@latest', blurkitTarball])
    run('npx', ['--yes', 'publint@latest', codecsTarball])
    console.log('  publint: clean for both packages')

    console.log('\n[4/9] @arethetypeswrong/cli')
    run('npx', ['--yes', '@arethetypeswrong/cli@latest', '--pack', '.'], { cwd: BLURKIT_DIR })
    run('npx', ['--yes', '@arethetypeswrong/cli@latest', '--pack', '.'], { cwd: CODECS_DIR })
    console.log('  attw: clean for both packages')

    console.log('\n[5/9] ESM + CJS entrypoint smoke in clean consumer')
    const consumer = path.join(work, 'consumer')
    mkdirSync(consumer)
    writeFileSync(
      path.join(consumer, 'package.json'),
      JSON.stringify({ name: 'pack-validate-consumer', private: true, type: 'module' }, null, 2),
    )
    run(
      'npm',
      ['install', '--no-audit', '--no-fund', blurkitTarball, codecsTarball, 'sharp@>=0.34.5 <0.36.0'],
      { cwd: consumer, quiet: false },
    )

    const esmScript = writeTempFile(consumer, 'smoke-esm.mjs', `
      const expected = ['encode', 'encodeMany', 'encodeManySettled']
      for (const spec of ${JSON.stringify(ENTRYPOINTS)}) {
        const mod = await import(spec)
        for (const name of expected) {
          if (typeof mod[name] !== 'function') {
            throw new Error(spec + ' is missing ' + name)
          }
        }
      }
      console.log('  esm imports ok')
    `)
    run('node', [esmScript], { cwd: consumer })

    const cjsScript = writeTempFile(consumer, 'smoke-cjs.cjs', `
      const assert = require('node:assert')
      const expected = ['encode', 'encodeMany', 'encodeManySettled']
      for (const spec of ${JSON.stringify(ENTRYPOINTS)}) {
        const mod = require(spec)
        for (const name of expected) {
          assert.strictEqual(typeof mod[name], 'function', spec + ' is missing ' + name)
        }
      }
      console.log('  cjs requires ok')
    `)
    run('node', [cjsScript], { cwd: consumer })

    console.log('\n[6/9] Type declarations resolve')
    const consumerTs = writeTempFile(consumer, 'consumer.ts', `
      import {
        encode as encodeRoot,
        type BlurKitOptions,
        type BlurResult,
      } from 'blurkit'
      import { encode as encodeNode } from 'blurkit/node'
      import { encode as encodeBrowser } from 'blurkit/browser'
      import { encode as encodeDeno } from 'blurkit/deno'
      import { encode as encodeEdge } from 'blurkit/edge'
      import { encode as encodeCloudflare } from 'blurkit/cloudflare'
      import { encode as encodeWasm } from 'blurkit/wasm'

      async function smoke(): Promise<void> {
        const options: BlurKitOptions = { size: 32, algorithm: 'blurhash' }
        const buffer = new Uint8Array([1, 2, 3])
        const nodeResult: BlurResult = await encodeNode(buffer, options)
        const browserResult: BlurResult = await encodeBrowser(buffer, options)
        const denoResult: BlurResult = await encodeDeno(buffer, options)
        const edgeResult: BlurResult = await encodeEdge(buffer, options)
        const wasmResult: BlurResult = await encodeWasm(buffer, options)
        const rootResult: BlurResult = await encodeRoot(buffer, options)
        const cloudflareResult: BlurResult = await encodeCloudflare(
          'https://example.com/image.jpg',
          options,
        )
        console.log(nodeResult, browserResult, denoResult, edgeResult, wasmResult, rootResult, cloudflareResult)
      }
      void smoke
    `)
    const tsc = path.join(REPO_ROOT, 'node_modules/.bin/tsc')
    run(
      tsc,
      [
        '--noEmit',
        '--strict',
        '--target', 'es2022',
        '--module', 'esnext',
        '--moduleResolution', 'bundler',
        '--lib', 'es2022,dom',
        '--skipLibCheck',
        consumerTs,
      ],
      { cwd: consumer },
    )
    console.log('  tsc consumer typecheck ok')

    console.log('\n[7/9] Module-graph scans on shipped dist')
    const distDir = path.join(consumer, 'node_modules/blurkit/dist')
    for (const entry of NO_NATIVE_ENTRIES) {
      scanForbidden(
        entry,
        distDir,
        ['sharp', 'node:fs', 'fs/promises', 'node:path'],
        'no-native entry',
      )
    }

    const nodeContent = readFileSync(path.join(distDir, 'node.js'), 'utf8')
    if (!nodeContent.includes('sharp')) {
      throw new Error('dist/node.js does not reference sharp at all')
    }
    if (!/import\(\s*["']sharp["']\s*\)/.test(nodeContent)) {
      throw new Error('dist/node.js does not keep sharp behind a dynamic import')
    }
    if (!nodeContent.includes('fs/promises') && !nodeContent.includes('node:fs')) {
      throw new Error('dist/node.js lost its node:fs usage')
    }
    console.log('  node entry: sharp present behind dynamic import, fs usage present')

    const indexContent = readFileSync(path.join(distDir, 'index.js'), 'utf8')
    if (!indexContent.includes('sharp')) {
      throw new Error('dist/index.js (root) does not reference sharp')
    }
    if (!/import\(\s*["']sharp["']\s*\)/.test(indexContent)) {
      throw new Error('dist/index.js does not keep sharp behind a dynamic import')
    }
    console.log('  root entry: sharp behind dynamic import')

    console.log('\n[8/9] Bundler checks (esbuild)')
    const esbuild = path.join(REPO_ROOT, 'node_modules/.bin/esbuild')
    const browserEntry = writeTempFile(consumer, 'bundle-browser.mjs', `
      import { encode } from 'blurkit/browser'
      console.log(typeof encode)
    `)
    const browserOut = path.join(work, 'browser-bundle.js')
    run(esbuild, [browserEntry, '--bundle', '--platform=browser', '--format=esm', `--outfile=${browserOut}`], {
      cwd: consumer,
    })
    const browserBundle = readFileSync(browserOut, 'utf8')
    for (const forbidden of ['sharp', 'node:fs', 'node:path']) {
      if (browserBundle.includes(forbidden)) {
        throw new Error(`browser bundle contains forbidden reference: ${forbidden}`)
      }
    }
    console.log('  browser bundle: no sharp / node-native references')

    const nodeEntry = writeTempFile(consumer, 'bundle-node.mjs', `
      import { encode } from 'blurkit/node'
      console.log(typeof encode)
    `)
    const nodeOut = path.join(work, 'node-bundle.js')
    run(
      esbuild,
      [
        nodeEntry,
        '--bundle',
        '--platform=node',
        '--format=esm',
        '--external:sharp',
        `--outfile=${nodeOut}`,
      ],
      { cwd: consumer },
    )
    const nodeBundle = readFileSync(nodeOut, 'utf8')
    if (!nodeBundle.includes('sharp')) {
      throw new Error('node bundle lost sharp entirely')
    }
    if (!/import\(\s*["']sharp["']\s*\)/.test(nodeBundle)) {
      throw new Error('node bundle did not keep sharp as a dynamic import')
    }
    console.log('  node bundle: sharp stays a lazy dynamic import')

    console.log('\n[9/9] Runtime encode smoke from packed package')
    const encodeScript = writeTempFile(consumer, 'encode-smoke.mjs', `
      import { encode } from 'blurkit/node'
      import sharp from 'sharp'
      const image = await sharp({
        create: { width: 64, height: 32, channels: 4, background: { r: 200, g: 90, b: 40, alpha: 1 } },
      }).png().toBuffer()
      const result = await encode(image, { size: 24 })
      if (result.hash.length === 0 || !result.dataURL.startsWith('data:image/png;base64,')) {
        throw new Error('encode smoke produced an invalid result')
      }
      console.log('  encode smoke ok:', result.width + 'x' + result.height)
    `)
    run('node', [encodeScript], { cwd: consumer })

    console.log('\npacked-package validation: ALL CHECKS PASSED')
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

main()
