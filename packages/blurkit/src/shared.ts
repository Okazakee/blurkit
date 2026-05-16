import type {
  BlurEncodeManySettledResult,
  BlurKitInput,
  BlurResult,
  DecodedImage,
  NormalizedBlurKitOptions,
  ResolvedInput,
} from './types'
import { createCacheKey } from './internal/cache-key'
import { renderBlurHash, toBlurHash } from './internal/blurhash'
import { renderThumbHash, toThumbHash } from './internal/thumbhash'

export interface RuntimeHandlers {
  resolveInput(input: BlurKitInput): Promise<ResolvedInput>
  decodeImage(resolved: ResolvedInput, options: NormalizedBlurKitOptions): Promise<DecodedImage>
  renderDataURL(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    format: NormalizedBlurKitOptions['outputFormat'],
  ): Promise<string>
}

const inflight = new Map<string, Promise<BlurResult>>()

export async function encodeWithRuntime(
  input: BlurKitInput,
  options: NormalizedBlurKitOptions,
  runtime: RuntimeHandlers,
): Promise<BlurResult> {
  const resolved = await runtime.resolveInput(input)
  const cacheKey = options.cache
    ? await createCacheKey(input, resolved.identifier, options)
    : undefined

  if (options.cache && cacheKey) {
    const cached = await options.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const existing = inflight.get(cacheKey)
    if (existing) {
      return existing
    }
  }

  const doWork = async (): Promise<BlurResult> => {
    const decoded = await runtime.decodeImage(resolved, options)

    let hash: string
    let renderedPixels: Uint8ClampedArray
    let renderWidth = decoded.width
    let renderHeight = decoded.height

    if (options.algorithm === 'blurhash') {
      hash = toBlurHash(
        decoded.pixels,
        decoded.width,
        decoded.height,
        options.componentX,
        options.componentY,
      )
      renderedPixels = renderBlurHash(hash, decoded.width, decoded.height)
    } else {
      hash = toThumbHash(decoded.pixels, decoded.width, decoded.height)
      const rendered = renderThumbHash(hash)
      renderedPixels = rendered.pixels
      renderWidth = rendered.width
      renderHeight = rendered.height
    }

    const result: BlurResult = {
      dataURL: await runtime.renderDataURL(
        renderedPixels,
        renderWidth,
        renderHeight,
        options.outputFormat,
      ),
      hash,
      algorithm: options.algorithm,
      width: decoded.width,
      height: decoded.height,
      meta: decoded.meta,
    }

    if (options.cache && cacheKey) {
      await options.cache.set(cacheKey, result)
    }

    return result
  }

  if (options.cache && cacheKey) {
    const promise = doWork().finally(() => {
      inflight.delete(cacheKey)
    })
    inflight.set(cacheKey, promise)
    return promise
  }

  return doWork()
}

export async function encodeManyWithRuntime(
  inputs: BlurKitInput[],
  options: NormalizedBlurKitOptions,
  runtime: RuntimeHandlers,
): Promise<BlurResult[]> {
  return Promise.all(inputs.map((input) => encodeWithRuntime(input, options, runtime)))
}

export async function encodeManySettledWithRuntime(
  inputs: BlurKitInput[],
  options: NormalizedBlurKitOptions,
  runtime: RuntimeHandlers,
): Promise<BlurEncodeManySettledResult[]> {
  const results = await Promise.allSettled(
    inputs.map((input) => encodeWithRuntime(input, options, runtime)),
  )

  return results.map((result, index) => {
    const input = inputs[index]!
    if (result.status === 'fulfilled') {
      return {
        status: 'fulfilled',
        input,
        value: result.value,
      }
    }

    return {
      status: 'rejected',
      input,
      reason: result.reason,
    }
  })
}
