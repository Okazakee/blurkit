---
title: Node Runtime
description: Use sharp-backed encoding for local paths, remote URLs, batching, cache, and manifests.
---

## Why this runtime

Use `blurkit/node` for build steps, CMS import jobs, server-side processing, and manifest generation.

## Encode from a Node pipeline

```ts
import { createFilesystemCache, encode } from 'blurkit/node'

const cache = createFilesystemCache({
  dir: './.cache/blurkit',
  ttlMs: 300_000,
})

const result = await encode('./public/hero.jpg', {
  size: 32,
  cache,
})
```

## Inputs and behavior

- Supported inputs:
  - local path string
  - remote `http`/`https` URL string
  - `URL`
  - `Blob`
  - `ArrayBuffer`
  - `Uint8Array` (Node `Buffer` works directly, including views with a non-zero byte offset)
- Requires `sharp` `>=0.34.5 <0.36.0` at execution time.
- Additional Node exports:
  - `encodeMany()`
  - `encodeManySettled()`
  - `createMemoryCache()`
  - `createFilesystemCache()`
  - `createManifest()`
  - `writeManifest()`

## Runtime notes

- Requires `sharp`.
- Missing `sharp` throws `BLURKIT_MISSING_SHARP` with install guidance.
- `encodeMany()` is fail-fast.

## Related

- [API: encodeMany()](/docs/api/encode-many/)
- [API: Cache](/docs/api/cache/)
- [CLI Overview](/docs/cli/)
