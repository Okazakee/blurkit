---
title: Deno Runtime
description: Use wasm-backed encoding with local file support and OffscreenCanvas rendering for Deno.
---

## When to use

Use `blurkit/deno` for Deno scripts, build steps, and server-side processing when you want local filesystem support without depending on `sharp`.

## Example

```ts
import { createFilesystemCache, encode } from 'blurkit/deno'

const cache = createFilesystemCache({
  dir: './.cache/blurkit',
  ttlMs: 300_000,
})

const result = await encode('./public/hero.jpg', {
  size: 32,
  cache,
})
```

## Inputs / Options / Behavior

- Supported inputs:
  - local path string
  - remote `http`/`https` URL string
  - `URL`
  - `Blob`
  - `ArrayBuffer`
- Image decoding uses `blurkit-wasm-codecs` (PNG, JPEG, WebP only).
- DataURL rendering uses native `OffscreenCanvas` when available, falling back to wasm rendering.
- Does not require `sharp`.
- Additional Deno exports:
  - `encodeMany()`
  - `encodeManySettled()`
  - `createMemoryCache()`
  - `createFilesystemCache()`
  - `createManifest()`
  - `writeManifest()`

## Limits / Caveats

- Requires `blurkit-wasm-codecs` at execution time.
- Missing wasm codecs throws `BLURKIT_MISSING_WASM_CODECS` with install guidance.
- Decode support is limited to PNG, JPEG, and WebP.
- `encodeMany()` is fail-fast.

## Next read

- [API: encode()](/docs/api/encode/)
- [API: Cache](/docs/api/cache/)
- [WASM Runtime](/docs/runtimes/wasm/)
