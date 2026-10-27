---
title: Cache
description: Reference for BlurKitCache and built-in cache helpers.
kind: api
---

## Cache interface

Use cache integration when your job may encode the same source multiple times.

## Encode with a filesystem cache

```ts
import { createFilesystemCache, encode } from 'blurkit/node'

const cache = createFilesystemCache({
  dir: './.cache/blurkit',
  ttlMs: 120_000,
})

const result = await encode('./public/hero.jpg', { cache })
```

## Helpers by runtime

```ts
interface BlurKitCache {
  get(key: string): Promise<BlurResult | undefined> | BlurResult | undefined
  set(key: string, value: BlurResult): Promise<void> | void
}
```

Built-in helpers:

| Helper                                          | Available from                 | Backed by        |
| ----------------------------------------------- | ------------------------------ | ---------------- |
| `createMemoryCache({ max? })`                   | `blurkit/node`, `blurkit/deno` | In-process map   |
| `createFilesystemCache({ dir, ttlMs? })`        | `blurkit/node`, `blurkit/deno` | Local disk       |
| `createCloudflareCache({ name?, ttlSeconds? })` | `blurkit/cloudflare`           | Worker Cache API |

These three exports are the complete set. Other runtimes accept any `BlurKitCache` you supply, but ship no helper of their own.

## Key behavior and limits

- Cache keys are content-aware: they include a digest of the resolved image bytes plus every output-affecting option, so a changed file, Blob, or remote URL produces a new entry instead of stale output.
- Memory cache is process-local and reset on restart.
- Filesystem cache is local-disk scoped and does not share entries across machines.
- Cloudflare cache depends on Worker Cache API availability and scope.
- The Cloudflare key is computed from the transformed response bytes, so `encode()` fetches and transforms the image before it can consult the cache. A hit returns the stored result without another encode, but it does not skip the upstream fetch/transform. The Cloudflare cache is therefore not a pre-encoding cache in the way the Node and Deno helpers are.

## Related

- [Node Runtime](/docs/runtimes/node/)
- [Cloudflare Runtime](/docs/runtimes/cloudflare/)
- [API: Options](/docs/api/options/)
