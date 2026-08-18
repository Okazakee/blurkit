/**
 * Real Bun runtime smoke for blurkit/node.
 *
 * Copied into a temporary consumer that has the packed blurkit tarball and
 * sharp installed, then executed with `bun run`.
 *
 * Verifies:
 *   - package import through the real export map
 *   - Buffer and Uint8Array input
 *   - image decode
 *   - BlurHash generation
 *   - rendered dataURL
 *   - no sharp eager-loading on import
 */

import { createRequire } from 'node:module'
import { encode } from 'blurkit/node'

const require = createRequire(import.meta.url)

const sharpEntry = require.resolve('sharp')
if (require.cache[sharpEntry]) {
  throw new Error('sharp was loaded eagerly by importing blurkit/node')
}

const sharp = require('sharp')

const image = await sharp({
  create: { width: 128, height: 64, channels: 4, background: { r: 30, g: 160, b: 90, alpha: 1 } },
})
  .png()
  .toBuffer()

const fromBuffer = await encode(image, { size: 32 })
if (fromBuffer.algorithm !== 'blurhash') throw new Error('unexpected algorithm')
if (!fromBuffer.dataURL.startsWith('data:image/png;base64,')) throw new Error('invalid dataURL')
if (fromBuffer.meta.originalWidth !== 128 || fromBuffer.meta.originalHeight !== 64) {
  throw new Error('invalid source metadata')
}

const fromUint8 = await encode(new Uint8Array(image), { algorithm: 'thumbhash', size: 16 })
if (fromUint8.width !== 16 || fromUint8.hash.length === 0) throw new Error('invalid Uint8Array encode')

console.log(
  `bun smoke ok: blurhash ${fromBuffer.width}x${fromBuffer.height}, sharp ${sharp.versions.sharp}`,
)
