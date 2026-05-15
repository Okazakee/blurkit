import { normalizeOptions } from './internal/normalize-options'
import { wasmRuntime } from './internal/wasm-runtime'
import { encodeManySettledWithRuntime, encodeManyWithRuntime, encodeWithRuntime } from './shared'
import type {
  BlurEncodeManySettledResult,
  BlurKitInput,
  BlurKitOptions,
  BlurKitWasmInput,
  BlurResult,
} from './types'

export type {
  BlurAlgorithm,
  BlurEncodeManySettledResult,
  BlurKitCache,
  BlurKitInput,
  BlurKitOptions,
  BlurKitRemoteURLString,
  BlurKitWasmInput,
  BlurOutputFormat,
  BlurResult,
} from './types'

export async function encode(input: BlurKitWasmInput, options?: BlurKitOptions): Promise<BlurResult>
export async function encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult> {
  return encodeWithRuntime(input, normalizeOptions(options), wasmRuntime)
}

export async function encodeMany(
  inputs: BlurKitWasmInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]>
export async function encodeMany(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]> {
  return encodeManyWithRuntime(inputs, normalizeOptions(options), wasmRuntime)
}

export async function encodeManySettled(
  inputs: BlurKitWasmInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]>
export async function encodeManySettled(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurEncodeManySettledResult[]> {
  return encodeManySettledWithRuntime(inputs, normalizeOptions(options), wasmRuntime)
}
