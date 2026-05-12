---
title: Limits and Caveats
description: Current runtime boundaries and important behavior to understand before using blurkit in production.
---

# Limits and caveats

This page documents current implementation limits so the rest of the docs can stay concise.

## Runtime boundaries

- `blurkit/node` requires `sharp`.
- `blurkit/browser` does not support local filesystem path strings.
- `blurkit/browser` remote URL usage depends on CORS.
- `blurkit/edge` requires `ImageDecoder` and `OffscreenCanvas`.
- `blurkit/edge` does not support local filesystem paths.

## API behavior

- `encodeMany()` is fail-fast.
- The root import is convenience-only and should not be treated as the best choice for bundler-sensitive production code.
- The shipped cache helper is memory-only and only exported from `blurkit/node`.

## Deferred, not current support

- persistent cache adapters
- broader edge decoder coverage
- framework-specific convenience adapters
- additional manifest output targets
