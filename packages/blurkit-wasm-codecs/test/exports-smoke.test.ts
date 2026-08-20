import { describe, expect, it } from 'vitest'

import { createWasmRuntimeHandlers, wasmRuntime } from '../src'

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- type guard must accept any value to narrow it.
function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

describe('blurkit-wasm-codecs exports', () => {
  it('exports runtime handlers', () => {
    const runtime = createWasmRuntimeHandlers()

    expect(runtime).toBe(wasmRuntime)
    expect(isFunction(runtime.resolveInput)).toBe(true)
    expect(isFunction(runtime.decodeImage)).toBe(true)
    expect(isFunction(runtime.renderDataURL)).toBe(true)
  })
})
