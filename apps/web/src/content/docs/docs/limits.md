---
title: Limits and Caveats
description: Runtime boundaries and behavior constraints to account for in production.
---

## When to use

Use this page before production rollout or when debugging behavior differences between runtimes.

## Runtime and API boundaries

Runtime boundaries:

- `blurkit/node` requires `sharp` at runtime.
- `blurkit/browser` rejects local filesystem path strings.
- `blurkit/browser` remote URL flow depends on CORS.
- `blurkit/edge` prefers native `ImageDecoder` + `OffscreenCanvas` and falls back to wasm.
- `blurkit/cloudflare` supports remote URL input only.
- `blurkit/wasm` decode support is PNG/JPEG/WebP only.
- `blurkit/edge` fallback and `blurkit/wasm` require `blurkit-wasm-codecs`.

Cross-cutting behavior:

- `encodeMany()` is fail-fast.
- `encodeManySettled()` returns per-item success/failure envelopes.
- Root import is condition-based (node/browser/worker), but explicit runtime subpaths are clearer.

## Not shipped by design

- Framework-specific adapters are not shipped.

## Next read

- [Roadmap](/docs/roadmap/)
- [Node Runtime](/docs/runtimes/node/)
- [Decision: Cache Interface](/docs/decisions/cache-interface/)
