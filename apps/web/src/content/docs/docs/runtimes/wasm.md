---
title: WASM Runtime
description: Encode placeholders with wasm decode/resize in runtimes without native image decode APIs.
---

## When to use

Use `blurkit/wasm` when your target runtime does not provide `ImageDecoder` and `OffscreenCanvas`, but you still need consistent placeholder generation.

## Example

```ts
import { encode } from 'blurkit/wasm'

const result = await encode('https://example.com/image.webp', {
  size: 32,
})
```

## Inputs / Options / Behavior

- Supported inputs:
  - remote `http`/`https` URL string
  - `URL`
  - `Blob`
  - `ArrayBuffer`
- Decode support: PNG, JPEG, WebP.
- Output support: PNG or JPEG data URL (via `outputFormat`).
- Includes `encodeMany()` and `encodeManySettled()`.
- Requires `blurkit-wasm-codecs` to be installed in your project.

## Limits / Caveats

- Local filesystem path strings are rejected.
- Decode support is intentionally limited to PNG/JPEG/WebP.
- Remote URL input still depends on network reachability and runtime fetch behavior.
- If codecs package is missing, calls throw `BLURKIT_MISSING_WASM_CODECS`.

## Next read

- [Edge Runtime](/docs/runtimes/edge/)
- [Cloudflare Runtime](/docs/runtimes/cloudflare/)
- [Limits and Caveats](/docs/limits/)
