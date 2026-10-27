---
title: Cloudflare Runtime
description: Encode placeholders in Cloudflare Workers through cf.image transforms.
---

## Why this runtime

Use `blurkit/cloudflare` for Cloudflare Workers where `ImageDecoder` or `OffscreenCanvas` is not available.

## Encode with Worker cache

```ts
import { createCloudflareCache, encode } from 'blurkit/cloudflare'

const cache = createCloudflareCache({ ttlSeconds: 300 })

const result = await encode('https://example.com/image.jpg', {
  size: 24,
  cache,
})

// result.dataURL is ready to render.
// result.hash is opaque on Cloudflare (see below).
```

## Inputs and transform path

- Supported inputs:
  - remote `http`/`https` URL string
  - `URL`
- Uses `cf.image` transform fetch options instead of decoding pixels in the Worker.
- Includes `encodeMany()` and `encodeManySettled()`.
- Supports `createCloudflareCache()` backed by the Worker Cache API.

## Hash semantics

Cloudflare is the one runtime where `hash` is not a portable BlurHash or ThumbHash:

- The runtime fetches a transformed image through `cf.image` and hashes the response bytes with SHA-256.
- `result.hash` is that digest, truncated and prefixed `cfbh:` or `cfth:` depending on the requested `algorithm`.
- `result.algorithm` echoes the option you passed; it does not mean the pixels were hashed with that algorithm.
- Standard BlurHash/ThumbHash decoders cannot decode this value.

Use `result.dataURL` for rendering. Treat `result.hash` as an opaque, deterministic cache or deduplication key inside Cloudflare.

## Metadata caveat

`meta.originalWidth` and `meta.originalHeight` come from Cloudflare's image-info lookup. When that lookup fails, the runtime substitutes the requested target dimensions, so those fields are not guaranteed to describe the source image.

## Limits

- Local paths, `Blob`, and `ArrayBuffer` are not supported.
- Requires Cloudflare Worker runtime features (`cf.image`, Cache API).
- The cache key is derived from the transformed response bytes, so the fetch and transform run before the cache is consulted. See [API: Cache](/docs/api/cache/).

## Related

- [Edge Runtime](/docs/runtimes/edge/)
- [API: Cache](/docs/api/cache/)
- [API: Result](/docs/api/result/)
