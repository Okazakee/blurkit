---
title: Quick Start
description: Generate your first placeholder and verify blurkit output shape.
---

## When to use

Use this page when you need one working placeholder quickly before reading full runtime and API references.

## Example

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  size: 32,
})

console.log(result.dataURL)
console.log(result.hash)
```

## Inputs / Options / Behavior

- `size` sets longest-side target while preserving aspect ratio.
- `encode()` returns a data URL plus metadata in one object.
- Use explicit entrypoints for predictable runtime behavior:
  - `blurkit/node` for build and server pipelines
  - `blurkit/deno` for Deno with local file support and wasm-backed decode
  - `blurkit/browser` for `File`/`Blob` input in client code
  - `blurkit/edge` for worker-style runtimes with native decode + wasm fallback
  - `blurkit/cloudflare` for Cloudflare Workers
  - `blurkit/wasm` for runtimes without native decode APIs
- Install `blurkit-wasm-codecs` when using `blurkit/deno`, `blurkit/wasm`, or edge fallback paths.
- Install `sharp` for `blurkit/node` and CLI.

## Limits / Caveats

- Node runtime requires `sharp` at execution time.
- Deno runtime requires `blurkit-wasm-codecs` and does not use `sharp`.
- Browser runtime does not support local path strings such as `./public/hero.jpg`.
- WASM paths require `blurkit-wasm-codecs` at execution time.

## Next read

- [API: encode()](/docs/api/encode/)
- [API: Options](/docs/api/options/)
- [Runtime Guides](/docs/runtimes/node/)
