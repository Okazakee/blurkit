---
title: Limits and Caveats
description: Runtime boundaries and behavior constraints to account for in production.
---

## When to use

Use this page before production rollout or when debugging behavior differences between runtimes.

## Example

```text
If you deploy to an edge worker without ImageDecoder, blurkit/edge cannot decode images.
```

## Runtime and API boundaries

Runtime boundaries:

- `blurkit/node` requires `sharp`.
- `blurkit/browser` rejects local filesystem path strings.
- `blurkit/browser` remote URL flow depends on CORS.
- `blurkit/edge` requires `ImageDecoder` and `OffscreenCanvas`.
- `blurkit/edge` rejects non-remote string paths.

Cross-cutting behavior:

- `encodeMany()` is fail-fast.
- Root import is convenience-first and not bundler-first.
- Shipped cache helper is memory-only.

## Not shipped by design

- Persistent cache adapters are not shipped.
- Framework-specific adapters are not shipped.

## Next read

- [Roadmap](/docs/roadmap/)
- [Node Runtime](/docs/runtimes/node/)
- [Decision: Cache Interface](/docs/decisions/cache-interface/)
