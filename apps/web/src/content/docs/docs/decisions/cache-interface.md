---
title: Cache Interface
description: Why cache is part of options and why persistent adapters are caller-owned today.
---

## When to use

Use this page when designing build or import pipelines that need deterministic reuse and you are deciding where cache policy should live.

## Example

```ts
const result = await encode(input, { cache })
```

## Inputs / Options / Behavior

- Cache is part of `BlurKitOptions` so callers can enable reuse without wrapping `encode()` in another API.
- The contract is intentionally low-level (`get` and `set`) to support sync and async adapters.
- The package ships one helper: `createMemoryCache()` from `blurkit/node`.

## Limits / Caveats

- Persistent storage policy is not defined by blurkit.
- Invalidating persistent entries across path, bytes, and options is caller-owned.
- Cache interface presence does not imply durable helper availability.

## Next read

- [API: Cache](/docs/api/cache/)
- [Node Runtime](/docs/runtimes/node/)
- [Roadmap](/docs/roadmap/)
