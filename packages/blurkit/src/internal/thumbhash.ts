import { rgbaToThumbHash, thumbHashToRGBA } from 'thumbhash'

import { fromBase64URL, toBase64URL } from './base64'

export function toThumbHash(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): string {
  return toBase64URL(rgbaToThumbHash(width, height, pixels))
}

export function renderThumbHash(hash: string): {
  width: number
  height: number
  pixels: Uint8ClampedArray
} {
  const decoded = thumbHashToRGBA(fromBase64URL(hash))
  return {
    width: decoded.w,
    height: decoded.h,
    pixels: new Uint8ClampedArray(decoded.rgba),
  }
}
