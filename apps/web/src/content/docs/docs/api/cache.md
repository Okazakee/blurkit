---
title: Cache
description: Reference for BlurKitCache and the Node memory cache helper.
---

## When to use

Use cache integration when your job may encode the same source multiple times in one process.

## Example

```ts
import { createMemoryCache, encode } from 'blurkit/node'

const cache = createMemoryCache({ max: 500 })

const result = await encode('./public/hero.jpg', { cache })
```

## Inputs / Options / Behavior

```ts
interface BlurKitCache {
  get(key: string): Promise<BlurResult | undefined> | BlurResult | undefined
  set(key: string, value: BlurResult): Promise<void> | void
}
```

- Cache is optional.
- When a cache is provided, blurkit reads before encode and writes after encode.
- Both sync and async cache adapters are supported.

## Limits / Caveats

- Built-in cache helper is memory-only.
- Persistent adapters are caller-owned.

## Next read

- [Node Runtime](/docs/runtimes/node/)
- [API: Options](/docs/api/options/)
- [Decision: Cache Interface](/docs/decisions/cache-interface/)
