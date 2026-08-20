import type { BlurKitInput } from '../types'

/**
 * Narrows a BlurKitInput union to its string member. Runtime adapters
 * discriminate inputs at their API boundary; this is the canonical guard so
 * every adapter shares one narrowing contract.
 */
export function isStringInput(input: BlurKitInput): input is string {
  return typeof input === 'string'
}
