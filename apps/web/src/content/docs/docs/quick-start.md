---
title: Quick Start
description: Generate your first placeholder and verify the blurkit result shape.
---

## What you need

Node 20.9+ (or Bun), an image on disk, and `sharp` available to the Node runtime. Install both packages:

```bash
pnpm add blurkit sharp
```

## Generate a placeholder

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  size: 32,
})

console.log(result.dataURL)
console.log(result.hash)
```

`size` sets the longest side of the encoded image and preserves the aspect ratio. `dataURL` is ready to render immediately; `hash` is the algorithm output if you want to decode later.

## What came back

| Field              | Meaning                                      |
| ------------------ | -------------------------------------------- |
| `dataURL`          | Rendered PNG or JPEG placeholder             |
| `hash`             | BlurHash or ThumbHash string                 |
| `algorithm`        | Algorithm used for this result               |
| `width` / `height` | Dimensions of the encoded image              |
| `meta`             | Source dimensions, optional format and alpha |

Full contract: [API: Result](/docs/api/result/). Options and defaults: [API: Options](/docs/api/options/).

## Choose your entrypoint

- `blurkit/node` — build steps, servers, CMS jobs.
- `blurkit/deno` — Deno with local paths and wasm-backed decode.
- `blurkit/browser` — `File`/`Blob` uploads in the client.
- `blurkit/edge` — worker runtimes with native decode, wasm when unavailable.
- `blurkit/cloudflare` — Workers that transform through `cf.image`.
- `blurkit/wasm` — runtimes without native decode APIs.

The [runtime matrix](/docs/installation/#runtime-compatibility-matrix) lists decode backends, accepted inputs, and the extra package each entrypoint needs.

## Next steps

- [API: encode()](/docs/api/encode/)
- [Runtime guides](/docs/runtimes/node/)
- [CLI](/docs/cli/)
