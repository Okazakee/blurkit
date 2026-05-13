---
title: Node Runtime
description: Use sharp-backed encoding for local paths, remote URLs, batching, cache, and manifests.
---

## When to use

Use `blurkit/node` for build steps, CMS import jobs, server-side processing, and manifest generation.

## Example

```ts
import { encode, createMemoryCache } from 'blurkit/node'

const cache = createMemoryCache({ max: 500 })

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
  - `createMemoryCache()`
  - `createManifest()`
  - `writeManifest()`
- Remote URL input is fetched before decode.

## Limits / Caveats

- Requires `sharp`.
- Root import can work in Node/Bun but explicit `blurkit/node` is safer for clear runtime intent.
- `encodeMany()` is fail-fast.

## Next read

- [API: encodeMany()](/docs/api/encode-many/)
- [API: Cache](/docs/api/cache/)
- [CLI Overview](/docs/cli/)
