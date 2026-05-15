import type { RuntimeHandlers } from '../shared'
import type { BlurKitInput, DecodedImage, NormalizedBlurKitOptions, ResolvedInput } from '../types'

type WasmCodecRuntimeHandlers = {
  resolveInput(input: BlurKitInput): Promise<ResolvedInput>
  decodeImage(resolved: ResolvedInput, options: NormalizedBlurKitOptions): Promise<DecodedImage>
  renderDataURL(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    format: 'png' | 'jpeg',
  ): Promise<string>
}

type WasmCodecsModule = {
  createWasmRuntimeHandlers?: () => WasmCodecRuntimeHandlers
  wasmRuntime?: WasmCodecRuntimeHandlers
}

let runtimePromise: Promise<WasmCodecRuntimeHandlers> | undefined

function createMissingWasmCodecsError(cause?: unknown): Error {
  const details = cause instanceof Error ? `\nCause: ${cause.message}` : ''
  const error = new Error(
    'BLURKIT_MISSING_WASM_CODECS: blurkit wasm codecs are not installed. ' +
      'Install them with `npm install blurkit-wasm-codecs` or `pnpm add blurkit-wasm-codecs`.' +
      details,
  ) as Error & { code: string }

  error.code = 'BLURKIT_MISSING_WASM_CODECS'
  return error
}

function isMissingCodecsDependency(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const code = (error as Error & { code?: string }).code
  if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') {
    return true
  }

  if (/blurkit-wasm-codecs/i.test(error.message)) {
    return true
  }

  const cause = (error as Error & { cause?: unknown }).cause
  if (cause && cause !== error) {
    return isMissingCodecsDependency(cause)
  }

  return false
}

async function loadWasmRuntime(): Promise<WasmCodecRuntimeHandlers> {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      let mod: WasmCodecsModule
      try {
        mod = await import('blurkit-wasm-codecs') as WasmCodecsModule
      } catch (error) {
        if (isMissingCodecsDependency(error)) {
          throw createMissingWasmCodecsError(error)
        }

        throw error
      }

      const runtime = typeof mod.createWasmRuntimeHandlers === 'function'
        ? mod.createWasmRuntimeHandlers()
        : mod.wasmRuntime

      if (!runtime) {
        throw createMissingWasmCodecsError(
          new Error('Package loaded but no runtime export was found.'),
        )
      }

      return runtime
    })().catch((error: unknown) => {
      runtimePromise = undefined
      throw error
    })
  }

  return runtimePromise
}

export const wasmRuntime: RuntimeHandlers = {
  async resolveInput(input: BlurKitInput): Promise<ResolvedInput> {
    const runtime = await loadWasmRuntime()
    return runtime.resolveInput(input)
  },

  async decodeImage(
    resolved: ResolvedInput,
    options: NormalizedBlurKitOptions,
  ): Promise<DecodedImage> {
    const runtime = await loadWasmRuntime()
    return runtime.decodeImage(resolved, options)
  },

  async renderDataURL(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    format: 'png' | 'jpeg',
  ): Promise<string> {
    const runtime = await loadWasmRuntime()
    return runtime.renderDataURL(pixels, width, height, format)
  },
}
