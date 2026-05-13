---
title: Cloudflare Runtime
description: Encode placeholders in Cloudflare Workers through cf.image transforms.
---

## When to use

Use `blurkit/cloudflare` for Cloudflare Workers where `ImageDecoder` or `OffscreenCanvas` is not available.

## Example

```ts
import { createCloudflareCache, encode } from 'blurkit/cloudflare'

const cache = createCloudflareCache({ ttlSeconds: 300 })

const result = await encode('https://example.com/image.jpg', {
  size: 24,
  cache,
})
```

## Inputs / Options / Behavior

- Supported inputs:
  - remote `http`/`https` URL string
  - `URL`
- Uses `cf.image` transform fetch options.
- Includes `encodeMany()` and `encodeManySettled()`.
- Supports `createCloudflareCache()` backed by Worker Cache API.

## Limits / Caveats

- Local paths, `Blob`, and `ArrayBuffer` are not supported.
- Requires Cloudflare Worker runtime features (`cf.image`, Cache API).

## Next read

- [Edge Runtime](/docs/runtimes/edge/)
- [API: Cache](/docs/api/cache/)
- [Limits and Caveats](/docs/limits/)
