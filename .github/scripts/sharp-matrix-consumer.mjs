#!/usr/bin/env node
/**
 * Sharp compatibility matrix consumer.
 *
 * This script is copied into a temporary consumer directory that has the
 * packed blurkit tarball and an explicit sharp version installed, then run
 * from that directory. It proves the package actually consumes the installed
 * sharp version (not merely that package.json accepts it) by running real
 * encodes and asserting the installed version matches the expected line.
 *
 * Usage:
 *   EXPECTED_SHARP_LINE=0.35 node sharp-matrix-consumer.mjs
 */

import { strict as assert } from 'node:assert'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)

const expectedLine = process.env.EXPECTED_SHARP_LINE
if (!expectedLine) {
  throw new Error('EXPECTED_SHARP_LINE is required (e.g. 0.34 or 0.35).')
}

// Resolve sharp the way blurkit/node resolves it: from the package's own
// location inside this consumer's node_modules.
const blurkitEntry = require.resolve('blurkit')
const blurkitDir = path.dirname(path.dirname(blurkitEntry))
const blurkitRequire = createRequire(path.join(blurkitDir, 'package.json'))
const sharpFromBlurkit = blurkitRequire('sharp')
const sharpFromConsumer = require('sharp')

for (const [label, sharpModule] of [
  ['consumer root', sharpFromConsumer],
  ['blurkit', sharpFromBlurkit],
]) {
  const version = sharpModule.versions?.sharp
  assert.ok(version, `${label} sharp has no version`)
  assert.ok(
    version.startsWith(expectedLine),
    `expected sharp ${expectedLine}.x from ${label}, got ${version}`,
  )
  assert.strictEqual(
    sharpModule,
    sharpFromConsumer,
    `${label} resolves a different sharp instance`,
  )
}

const installedBlurkitVersion = JSON.parse(
  readFileSync(path.join(blurkitDir, 'package.json'), 'utf8'),
).version

async function createPng(background, width = 64, height = 64) {
  return sharpFromConsumer({
    create: {
      width,
      height,
      channels: 4,
      background: { ...background, alpha: background.alpha ?? 1 },
    },
  })
    .png()
    .toBuffer()
}

async function createJpeg(background, width = 48, height = 32) {
  return sharpFromConsumer({
    create: {
      width,
      height,
      channels: 3,
      background,
    },
  })
    .jpeg()
    .toBuffer()
}

const { encode } = await import('blurkit/node')

const png = await createPng({ r: 230, g: 120, b: 70 })
const jpeg = await createJpeg({ r: 40, g: 160, b: 90 })

// Buffer input directly, no casts or slicing.
const bufferResult = await encode(png, { size: 24 })
assert.equal(bufferResult.algorithm, 'blurhash')
assert.ok(bufferResult.dataURL.startsWith('data:image/png;base64,'))
assert.equal(bufferResult.meta.originalWidth, 64)
assert.equal(bufferResult.meta.originalHeight, 64)
assert.ok(bufferResult.hash.length > 0)

// Uint8Array input.
const uint8Result = await encode(new Uint8Array(png), { size: 12 })
assert.equal(uint8Result.width, 12)
assert.equal(uint8Result.height, 12)

// Exact ArrayBuffer input.
const arrayBuffer = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength)
const arrayBufferResult = await encode(arrayBuffer, { size: 12 })
assert.equal(arrayBufferResult.width, 12)
assert.ok(arrayBufferResult.hash.length > 0)

// JPEG + thumbhash + jpeg output.
const thumbResult = await encode(jpeg, {
  algorithm: 'thumbhash',
  outputFormat: 'jpeg',
  size: 16,
})
assert.equal(thumbResult.algorithm, 'thumbhash')
assert.ok(thumbResult.dataURL.startsWith('data:image/jpeg;base64,'))
assert.equal(thumbResult.meta.originalWidth, 48)
assert.equal(thumbResult.meta.originalHeight, 32)

// Equivalent Buffer vs ArrayBuffer produce equivalent output.
const equivalent = await encode(arrayBuffer, { size: 24 })
assert.equal(equivalent.hash, bufferResult.hash)
assert.equal(equivalent.dataURL, bufferResult.dataURL)

console.log(
  `sharp-matrix consumer OK: sharp ${sharpFromConsumer.versions.sharp}, blurkit ${installedBlurkitVersion}`,
)
