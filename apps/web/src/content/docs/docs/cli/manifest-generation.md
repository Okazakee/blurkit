---
title: Manifest Generation
description: Generate one BlurManifest JSON file from a local directory.
kind: cli
---

## When to generate a manifest

Use this flow when your build or app needs a precomputed placeholder map. A directory input always produces a manifest; `--glob` only narrows what is selected.

## Build a folder manifest

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

## Key mapping

- Without `--glob`, the default selection is `**/*.{jpg,jpeg,png,webp}`.
- `--glob` replaces the default selection.
- `--concurrency` controls parallel file encoding.
- `--backend` selects sharp (default) or wasm.
- Key mapping behavior:
  - files under `/public` map to URL-style keys such as `/images/hero.jpg`
  - other folders map to normalized relative keys
  - `--base-path` prepends a custom key prefix

## Caveats

- `--glob` cannot be used with remote URL input.
- Manifest key conventions must match your app lookup strategy.

## Related

- [API: Manifest Helpers](/docs/api/manifest/)
- [Guide: Build-time Manifest Generation](/docs/guides/build-time-manifest-generation/)
- [Limits and Caveats](/docs/limits/)
