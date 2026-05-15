import { describe, expect, it } from 'vitest'

import { createWasmRuntimeHandlers, wasmRuntime } from '../src'

describe('blurkit-wasm-codecs exports', () => {
  it('exports runtime handlers', () => {
    const runtime = createWasmRuntimeHandlers()

    expect(runtime).toBe(wasmRuntime)
    expect(typeof runtime.resolveInput).toBe('function')
    expect(typeof runtime.decodeImage).toBe('function')
    expect(typeof runtime.renderDataURL).toBe('function')
  })
})
