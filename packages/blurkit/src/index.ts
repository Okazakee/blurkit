import type { BlurKitInput, BlurKitOptions, BlurResult } from './types'

export type {
  BlurAlgorithm,
  BlurKitCache,
  BlurKitInput,
  BlurKitOptions,
  BlurManifest,
  BlurOutputFormat,
  BlurResult,
} from './types'

export {
  createManifest,
  writeManifest,
} from './manifest'

const runtimeEntrypoints = {
  browser: './browser',
  node: './node',
  edge: './edge',
} as const

function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node)
}

async function loadRuntime(name: keyof typeof runtimeEntrypoints) {
  const specifier = runtimeEntrypoints[name]
  return import(specifier)
}

export async function encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult> {
  if (isBrowserRuntime()) {
    const mod = await loadRuntime('browser')
    return mod.encode(input, options)
  }

  if (isNodeRuntime() || typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined') {
    const mod = await loadRuntime('node')
    return mod.encode(input, options)
  }

  const mod = await loadRuntime('edge')
  return mod.encode(input, options)
}

export async function encodeMany(
  inputs: BlurKitInput[],
  options?: BlurKitOptions,
): Promise<BlurResult[]> {
  return Promise.all(inputs.map((input) => encode(input, options)))
}
