import type { NormalizedBlurKitOptions } from '../types'

function roundDimension(value: number): number {
  return Math.max(1, Math.round(value))
}

export function resolveTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  options: NormalizedBlurKitOptions,
): { width: number; height: number } {
  if (options.width && options.height) {
    return {
      width: options.width,
      height: options.height,
    }
  }

  if (options.width) {
    return {
      width: options.width,
      height: roundDimension((originalHeight / originalWidth) * options.width),
    }
  }

  if (options.height) {
    return {
      width: roundDimension((originalWidth / originalHeight) * options.height),
      height: options.height,
    }
  }

  if (originalWidth >= originalHeight) {
    return {
      width: options.size,
      height: roundDimension((originalHeight / originalWidth) * options.size),
    }
  }

  return {
    width: roundDimension((originalWidth / originalHeight) * options.size),
    height: options.size,
  }
}

