---
title: Cache
description: Reference for BlurKitCache and built-in cache helpers.
---

## When to use

Use cache integration when your job may encode the same source multiple times.

## Example

```ts
import { createFilesystemCache, encode } from 'blurkit/node'

const cache = createFilesystemCache({
  dir: './.cache/blurkit',
  ttlMs: 120_000,
})

const result = await encode('./public/hero.jpg', { cache })
```

## Inputs / Options / Behavior

```ts
interface BlurKitCache {
  get(key: string): Promise<BlurResult | undefined> | BlurResult | undefined
  set(key: string, value: BlurResult): Promise<void> | void
}
```

Built-in helpers:

- `createMemoryCache({ max? })` from `blurkit/node` and `blurkit/deno`
- `createFilesystemCache({ dir, ttlMs? })` from `blurkit/node` and `blurkit/deno`
- `createCloudflareCache({ name?, ttlSeconds? })` from `blurkit/cloudflare`

## Limits / Caveats

- Memory cache is process-local and reset on restart.
- Filesystem cache is local-disk scoped.
- Cloudflare cache depends on Worker Cache API availability and scope.

## Next read

- [Node Runtime](/docs/runtimes/node/)
- [Cloudflare Runtime](/docs/runtimes/cloudflare/)
- [API: Options](/docs/api/options/)
