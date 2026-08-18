import type { NormalizedBlurKitOptions, ResolvedInput } from '../types'
import { toOwnedBytes } from './bytes'

/**
 * Cache identity version. Bump when the key derivation changes so stale
 * entries produced by older schemes are never read.
 */
const CACHE_KEY_VERSION = 2

function toHex(bytes: Uint8Array): string {
  let result = ''
  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, '0')
  }
  return result
}

async function hashBytes(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(new Uint8Array(digest))
}

/**
 * Content-aware cache identity.
 *
 * The key MUST cover the resolved image bytes, not the input identifier:
 * identifiers are mutable/reusable (an ArrayBuffer or Blob has no stable
 * identity, two Files can share a filename, a filesystem path or remote URL
 * can serve different bytes over time). A cache keyed only on identifier +
 * options can return the placeholder generated for different image bytes.
 *
 * All normalized options that affect output participate, and the digest is
 * computed over the exact owned byte sequence (respecting byteOffset and
 * byteLength of the resolved view).
 */
export async function createCacheKey(
  resolved: ResolvedInput,
  options: NormalizedBlurKitOptions,
): Promise<string> {
  const bytesHash = await hashBytes(toOwnedBytes(resolved.bytes))
  const metadataHash = await hashBytes(
    new TextEncoder().encode(
      JSON.stringify({
        version: CACHE_KEY_VERSION,
        mimeType: resolved.mimeType ?? null,
        options: {
          algorithm: options.algorithm,
          size: options.size,
          width: options.width ?? null,
          height: options.height ?? null,
          componentX: options.componentX,
          componentY: options.componentY,
          outputFormat: options.outputFormat,
        },
      }),
    ),
  )

  return `blurkit:v${CACHE_KEY_VERSION}:${bytesHash}:${metadataHash}`
}
