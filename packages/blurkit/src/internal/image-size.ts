export interface ImageDimensions {
  width: number
  height: number
}

function readPngDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  if (bytes.length < 24) {
    return undefined
  }

  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature[index]) {
      return undefined
    }
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const width = view.getUint32(16)
  const height = view.getUint32(20)

  return width > 0 && height > 0 ? { width, height } : undefined
}

function readJpegDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return undefined
  }

  let offset = 2

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1] ?? 0

    // Standalone markers carry no length field.
    if (marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }

    if (marker === 0xd9 || marker === 0xda) {
      return undefined
    }

    const segmentLength = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0)
    if (segmentLength < 2) {
      return undefined
    }

    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc

    if (isStartOfFrame) {
      if (offset + 9 > bytes.length) {
        return undefined
      }

      const height = ((bytes[offset + 5] ?? 0) << 8) | (bytes[offset + 6] ?? 0)
      const width = ((bytes[offset + 7] ?? 0) << 8) | (bytes[offset + 8] ?? 0)

      return width > 0 && height > 0 ? { width, height } : undefined
    }

    offset += 2 + segmentLength
  }

  return undefined
}

/**
 * Reads the pixel dimensions from PNG or JPEG bytes without decoding the image.
 * Returns `undefined` for other formats or truncated data.
 */
export function readImageDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  return readPngDimensions(bytes) ?? readJpegDimensions(bytes)
}
