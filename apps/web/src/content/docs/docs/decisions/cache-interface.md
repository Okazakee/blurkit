---
title: Cache Interface
description: Why the cache contract exists in the public options shape even though only one helper ships today.
---

`BlurKitOptions.cache` exists because placeholder generation often runs inside repeatable pipelines: static builds, CMS imports, asset manifests, and server-side warmup jobs. Those flows want stable results, but they also want a straightforward way to skip duplicate work when the same input is encountered more than once.

## Why it is part of the options shape

Putting the cache contract on `BlurKitOptions` keeps caching close to the work being performed. Callers do not need to wrap `encode()` in a second abstraction just to add memoization later, and libraries consuming `blurkit` can pass a cache through without changing their higher-level APIs.

That decision keeps the current surface small while still leaving room for:

- Build tools that want a short-lived in-memory cache.
- Import jobs that may want to memoize during a single run.
- Future adapters that map the same contract onto disk, KV, or other persistent stores.

:::note
The shipped helper today is `createMemoryCache()` from `blurkit/node`. It is intentionally scoped to one process and one run.
:::

## Why persistent adapters were deferred

Persistent cache helpers sound simple, but they force decisions the package does not yet want to lock in:

- Cache keys for local files vs remote URLs.
- Invalidation rules when image bytes change but the path does not.
- Serialization details for `BlurResult`.
- Cross-runtime guarantees for Node, browser, and edge environments.

Shipping an opinionated adapter before those trade-offs are settled would imply support that the package cannot defend yet.

:::caution
The current cache interface is a low-level contract, not a promise that `blurkit` already includes durable storage helpers.
:::

Read [API: Cache](/docs/api/cache/) for the concrete interface and helper usage.
