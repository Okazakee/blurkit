---
title: Cache
description: Reference for the BlurKitCache interface and the shipped Node memory cache helper.
---

# API: Cache

The shared options type accepts a `cache` object so callers can avoid recomputing placeholders during build-time or import workflows.

## Interface

```ts
interface BlurKitCache {
  get(key: string): Promise<BlurResult | undefined> | BlurResult | undefined
  set(key: string, value: BlurResult): Promise<void> | void
}
```

## Shipped helper

```ts
import { createMemoryCache } from 'blurkit/node'

const cache = createMemoryCache({ max: 500 })
```

The package currently ships one concrete helper: an in-memory LRU-style cache exposed from `blurkit/node`.

## What it is for

- repeated local build runs
- manifest generation in one process
- import pipelines that may see the same image more than once

Persistent cache adapters are intentionally deferred and are not part of the current package surface.
