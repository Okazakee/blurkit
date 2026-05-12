import { decode as decodeBlurHash, encode as encodeBlurHash } from 'blurhash'

export function toBlurHash(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  componentX: number,
  componentY: number,
): string {
  return encodeBlurHash(pixels, width, height, componentX, componentY)
}

export function renderBlurHash(hash: string, width: number, height: number): Uint8ClampedArray {
  return decodeBlurHash(hash, width, height)
}

