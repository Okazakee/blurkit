---
title: Edge Runtime
description: Encode placeholders in worker-style runtimes with native decode first and wasm fallback.
---

## When to use

Use `blurkit/edge` for worker-style runtimes when you want one entrypoint that prefers native decode APIs and falls back to wasm when they are missing.

## Example

```ts
import { encode } from 'blurkit/edge'

const result = await encode('https://example.com/image.jpg')
```

## Inputs / Options / Behavior

- Supported inputs:
  - remote `http`/`https` URL string
  - `URL`
  - `Blob`
  - `ArrayBuffer`
- Includes `encodeMany()` and `encodeManySettled()`.
- Runtime selection:
  - native path: `ImageDecoder` + `OffscreenCanvas`
  - fallback path: wasm runtime (PNG/JPEG/WebP decode)
- Fallback path requires `blurkit-wasm-codecs` to be installed.

## Limits / Caveats

- Non-remote string input is rejected.
- If native APIs are missing, edge automatically tries wasm fallback.
- If fallback codecs are missing, edge throws `BLURKIT_MISSING_WASM_CODECS`.
- If fallback fails for other reasons, error message includes both native and fallback guidance.
- For Cloudflare Workers, prefer `blurkit/cloudflare`.

## Next read

- [WASM Runtime](/docs/runtimes/wasm/)
- [Cloudflare Runtime](/docs/runtimes/cloudflare/)
- [API: encode()](/docs/api/encode/)
