---
title: Limits and Caveats
description: Runtime boundaries, behavior constraints, and design decisions to account for in production.
---

## When to use

Use this page before production rollout or when debugging behavior differences between runtimes.

## Runtime boundaries

- `blurkit/node` requires `sharp` at runtime.
- `blurkit/deno` requires `blurkit-wasm-codecs` and uses wasm-backed decode with canvas render.
- `blurkit/browser` rejects local filesystem path strings.
- `blurkit/browser` remote URL flow depends on CORS.
- `blurkit/edge` prefers native `ImageDecoder` + `OffscreenCanvas` and falls back to wasm.
- `blurkit/cloudflare` supports remote URL input only.
- `blurkit/wasm` decode support is PNG/JPEG/WebP only.
- `blurkit/deno`, `blurkit/edge` fallback, and `blurkit/wasm` require `blurkit-wasm-codecs`.

## Cross-cutting behavior

- `encodeMany()` is fail-fast.
- `encodeManySettled()` returns per-item success/failure envelopes.
- Root import is condition-based (node/browser/worker), but explicit runtime subpaths are clearer.

## Cache design

- Cache is part of `BlurKitOptions` so callers can enable reuse without wrapping `encode()`.
- The contract is intentionally low-level (`get` and `set`) to support sync and async adapters.
- The package ships one helper: `createMemoryCache()` from `blurkit/node`.
- Persistent storage policy is not defined by blurkit — invalidating entries across path, bytes, and options is caller-owned.
- Cache interface presence does not imply durable helper availability.

## Not shipped by design

- Framework-specific adapters are not shipped.
