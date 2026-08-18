/**
 * Real Deno runtime smoke for blurkit/deno + blurkit-wasm-codecs.
 *
 * Copied into a temporary consumer that has the packed blurkit and
 * blurkit-wasm-codecs tarballs installed, then executed with:
 *
 *   deno run --allow-read --allow-env --allow-ffi --allow-net deno-smoke.ts
 *
 * Deno resolves the bare `blurkit/deno` specifier through the consumer's
 * node_modules. Verifies:
 *   - ArrayBuffer and Uint8Array input
 *   - PNG decode through wasm codecs
 *   - BlurHash and ThumbHash output
 *   - rendered dataURL (png and jpeg)
 *   - no sharp requirement
 */

import { encode } from 'blurkit/deno'

const PNG_1X1 = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)

const fromUint8 = await encode(new Uint8Array(PNG_1X1), { size: 8 })
if (fromUint8.algorithm !== 'blurhash') throw new Error('unexpected algorithm')
if (!fromUint8.dataURL.startsWith('data:image/png;base64,')) throw new Error('invalid dataURL')
if (fromUint8.width !== 8 || fromUint8.height !== 8) throw new Error('invalid dimensions')

const fromArrayBuffer = await encode(
  PNG_1X1.buffer.slice(PNG_1X1.byteOffset, PNG_1X1.byteOffset + PNG_1X1.byteLength),
  { size: 8 },
)
if (fromArrayBuffer.hash !== fromUint8.hash) throw new Error('ArrayBuffer/Uint8Array mismatch')

const thumb = await encode(new Uint8Array(PNG_1X1), { algorithm: 'thumbhash', size: 8 })
if (thumb.algorithm !== 'thumbhash' || thumb.hash.length === 0) throw new Error('thumbhash failed')

const jpeg = await encode(new Uint8Array(PNG_1X1), { size: 8, outputFormat: 'jpeg' })
if (!jpeg.dataURL.startsWith('data:image/jpeg;base64,')) throw new Error('jpeg dataURL failed')

console.log(`deno smoke ok: blurhash ${fromUint8.width}x${fromUint8.height}, thumbhash, png+jpeg`)
