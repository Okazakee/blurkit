---
title: Edge Runtime
description: Encode placeholders in runtimes that provide ImageDecoder and OffscreenCanvas.
---

## When to use

Use `blurkit/edge` when your worker runtime exposes `ImageDecoder` and `OffscreenCanvas`.

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

## Limits / Caveats

- Non-remote string input is rejected.
- Runtime fails when `ImageDecoder` or `OffscreenCanvas` is unavailable.
- For Cloudflare Workers, prefer `blurkit/cloudflare`.

## Next read

- [Cloudflare Runtime](/docs/runtimes/cloudflare/)
- [API: encode()](/docs/api/encode/)
- [Limits and Caveats](/docs/limits/)
