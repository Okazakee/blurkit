import type { BlurKitOptions, NormalizedBlurKitOptions } from '../types'

const DEFAULTS: Omit<NormalizedBlurKitOptions, 'cache'> = {
  algorithm: 'blurhash',
  size: 32,
  componentX: 4,
  componentY: 3,
  outputFormat: 'png',
}

function asPositiveInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`Expected "${field}" to be a positive integer.`)
  }

  return value
}

export function normalizeOptions(options: BlurKitOptions = {}): NormalizedBlurKitOptions {
  const width = asPositiveInteger(options.width, 'width')
  const height = asPositiveInteger(options.height, 'height')
  const size = asPositiveInteger(options.size ?? DEFAULTS.size, 'size') ?? DEFAULTS.size
  const componentX = asPositiveInteger(options.componentX ?? DEFAULTS.componentX, 'componentX') ?? DEFAULTS.componentX
  const componentY = asPositiveInteger(options.componentY ?? DEFAULTS.componentY, 'componentY') ?? DEFAULTS.componentY

  if (options.algorithm && options.algorithm !== 'blurhash' && options.algorithm !== 'thumbhash') {
    throw new TypeError('Expected "algorithm" to be "blurhash" or "thumbhash".')
  }

  if (options.outputFormat && options.outputFormat !== 'png' && options.outputFormat !== 'jpeg') {
    throw new TypeError('Expected "outputFormat" to be "png" or "jpeg".')
  }

  return {
    algorithm: options.algorithm ?? DEFAULTS.algorithm,
    size,
    width,
    height,
    componentX,
    componentY,
    outputFormat: options.outputFormat ?? DEFAULTS.outputFormat,
    cache: options.cache,
  }
}

