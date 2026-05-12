---
title: Manifest Generation
description: Generate a BlurManifest for a folder of images with the CLI.
---

# CLI: Manifest Generation

Use manifest generation when you want one JSON file that can be committed, loaded at runtime, or imported into another system.

## Basic command

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

## Path behavior

- Files inside `/public` become public URL-style keys such as `/images/hero.jpg`.
- Other folders default to normalized relative keys.
- `--base-path` lets you rewrite manifest keys for downstream consumers.

## Useful flags

```bash
npx blurkit encode ./assets \
  --glob "**/*.png" \
  --base-path /static \
  --concurrency 4 \
  --out blur-manifest.json
```

## Caveat

`--glob` is only valid for local directory input. Remote URLs always behave like single-image input.
