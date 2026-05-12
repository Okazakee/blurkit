import type { BlurKitInput, NormalizedBlurKitOptions } from '../types'

function describeInput(input: BlurKitInput, identifier: string): string {
  if (typeof input === 'string') {
    return `string:${identifier}`
  }

  if (input instanceof URL) {
    return `url:${input.toString()}`
  }

  const name = typeof File !== 'undefined' && input instanceof File ? input.name : undefined
  return `${Object.prototype.toString.call(input)}:${name ?? identifier}`
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function createCacheKey(
  input: BlurKitInput,
  identifier: string,
  options: NormalizedBlurKitOptions,
): Promise<string> {
  const payload = JSON.stringify({
    version: 1,
    input: describeInput(input, identifier),
    options: {
      algorithm: options.algorithm,
      size: options.size,
      width: options.width,
      height: options.height,
      componentX: options.componentX,
      componentY: options.componentY,
      outputFormat: options.outputFormat,
    },
  })

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return `blurkit:v1:${toHex(new Uint8Array(digest))}`
}

