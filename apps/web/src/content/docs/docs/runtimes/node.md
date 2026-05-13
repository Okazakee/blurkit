---
title: Node Runtime
description: Use sharp-backed encoding for local paths, remote URLs, batching, cache, and manifests.
---

## When to use

Use `blurkit/node` for build steps, CMS import jobs, server-side processing, and manifest generation.

## Example

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

## Inputs / Options / Behavior

- Supported inputs:
  - local path string
  - remote `http`/`https` URL string
  - `URL`
  - `Blob`
  - `ArrayBuffer`
- Additional Node exports:
  - `encodeMany()`
  - `encodeManySettled()`
  - `createMemoryCache()`
  - `createFilesystemCache()`
  - `createManifest()`
  - `writeManifest()`

## Limits / Caveats

- Requires `sharp`.
- Missing `sharp` throws `BLURKIT_MISSING_SHARP` with install guidance.
- `encodeMany()` is fail-fast.

## Next read

- [API: encodeMany()](/docs/api/encode-many/)
- [API: Cache](/docs/api/cache/)
- [CLI Overview](/docs/cli/)
