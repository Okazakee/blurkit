---
title: Edge Runtime
description: Encode placeholders in worker-style runtimes with native decode first and wasm fallback.
kind: runtime
entrypoint: blurkit/edge
backend: 'native + wasm'
install: 'blurkit-wasm-codecs (fallback)'
---

## Why this runtime

Use `blurkit/edge` for worker-style runtimes when you want one entrypoint that prefers native decode APIs and falls back to wasm when they are missing.

## Encode a remote image

```ts
import { encode } from 'blurkit/edge'

const result = await encode('https://example.com/image.jpg')
```

## Backend selection

- Supported inputs:
  - remote `http`/`https` URL string
  - `URL`
  - `Blob`
  - `ArrayBuffer`
  - `Uint8Array`
- Includes `encodeMany()` and `encodeManySettled()`.
- Backend selection happens before decoding:
  - native backend when `ImageDecoder` and `OffscreenCanvas` are both available
  - wasm backend when either API is missing
- The wasm backend requires `blurkit-wasm-codecs` to be installed.

## Edge limits

- Non-remote string input is rejected.
- The fallback is chosen by API availability, not by failure: once the native backend is selected, decode errors propagate and are not retried with wasm.
- If the wasm codecs are missing, edge throws `BLURKIT_MISSING_WASM_CODECS`.
- For Cloudflare Workers, prefer `blurkit/cloudflare`.

## Related

- [WASM Runtime](/docs/runtimes/wasm/)
- [Cloudflare Runtime](/docs/runtimes/cloudflare/)
- [API: encode()](/docs/api/encode/)
