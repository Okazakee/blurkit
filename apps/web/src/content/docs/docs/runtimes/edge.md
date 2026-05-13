---
title: Edge Runtime
description: Encode placeholders in worker-style runtimes that provide ImageDecoder and OffscreenCanvas.
---

## When to use

Use `blurkit/edge` when you run image processing in worker-like platforms without `sharp`.

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
- Decode path depends on `ImageDecoder`.
- Rendering path depends on `OffscreenCanvas`.

## Limits / Caveats

- Non-remote string input is rejected.
- Runtime fails when `ImageDecoder` or `OffscreenCanvas` is unavailable.
- `encodeMany()` is fail-fast.

## Next read

- [API: encode()](/docs/api/encode/)
- [Limits and Caveats](/docs/limits/)
- [Roadmap](/docs/roadmap/)
