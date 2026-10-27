---
title: Limits and Caveats
description: Runtime boundaries, cross-cutting behavior, and features blurkit deliberately does not ship.
---

## Runtime boundaries

The [runtime compatibility matrix](/docs/installation/#runtime-compatibility-matrix) is the canonical list of entrypoints, decode backends, accepted inputs, and extra packages. This page covers the behavior that matrix cannot express.

Boundaries worth knowing:

- `blurkit/browser` rejects local filesystem path strings, and remote URLs depend on CORS.
- `blurkit/cloudflare` accepts remote URLs only, and its `hash` is not a portable BlurHash/ThumbHash. See [Cloudflare hash semantics](/docs/api/result/#cloudflare-hash-semantics).
- `blurkit/edge` selects wasm only when `ImageDecoder` or `OffscreenCanvas` is missing. Native decode errors are not retried with wasm.
- `blurkit/wasm` decodes PNG, JPEG, and WebP only.
- `blurkit/deno`, `blurkit/wasm`, and edge fallback paths need `blurkit-wasm-codecs` at execution time.

## Behavior that applies everywhere

- `encodeMany()` is fail-fast; `encodeManySettled()` returns ordered fulfilled/rejected entries.
- The root import resolves through conditional exports (`node`, `browser`, `worker`, `deno`). Explicit runtime subpaths are clearer in framework code.
- Missing dependencies fail with identifiable error codes: `BLURKIT_MISSING_SHARP` and `BLURKIT_MISSING_WASM_CODECS` (attach your own handling by `code`, not by message text).
- `result.width`/`result.height` describe the encoded image. For ThumbHash the rendered data URL can use different pixel dimensions.

## Cache design

- Cache is part of `BlurKitOptions`, so callers enable reuse without wrapping `encode()`.
- The contract is intentionally low-level (`get` and `set`) to support sync and async adapters.
- `blurkit/node` and `blurkit/deno` ship `createMemoryCache()` and `createFilesystemCache()`; `blurkit/cloudflare` ships `createCloudflareCache()`. See [API: Cache](/docs/api/cache/) for the canonical list.
- blurkit derives content-aware keys; persistence is caller-owned. You choose where entries live, how long they are retained, when they are cleaned up, and any custom storage policy.
- The Cloudflare helper keys on transformed bytes, so it does not avoid the upstream transform on a hit.

## Not shipped by design

- Framework-specific adapters and component wrappers.
- Full image processing beyond placeholder output.
- Placeholder animation or progressive-enhancement helpers.
- Preset collections or curated hash libraries.
- CDN-specific transform pipelines beyond the Cloudflare runtime.

See the [Roadmap](/docs/roadmap/) for committed work, exploratory ideas, and the reasoning behind these boundaries.
