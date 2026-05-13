---
title: Manifest Generation
description: Generate one BlurManifest JSON file from a local directory.
---

## When to use

Use this flow when your build or app needs a precomputed placeholder map.

## Example

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

## Inputs / Options / Behavior

- `--glob` selects files inside the input directory.
- `--concurrency` controls parallel file encoding.
- Key mapping behavior:
  - files under `/public` map to URL-style keys such as `/images/hero.jpg`
  - other folders map to normalized relative keys
  - `--base-path` prepends a custom key prefix

## Limits / Caveats

- `--glob` cannot be used with remote URL input.
- Manifest key conventions must match your app lookup strategy.

## Next read

- [API: Manifest Helpers](/docs/api/manifest/)
- [Guide: Build-time Manifest Generation](/docs/guides/build-time-manifest-generation/)
- [Limits and Caveats](/docs/limits/)
