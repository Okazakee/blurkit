---
title: Single Image
description: Use the CLI to generate one BlurResult from a local path or remote URL.
---

# CLI: Single Image

Use the CLI when you want a single JSON result without wiring up your own script.

## Local file

```bash
npx blurkit encode ./public/hero.jpg --pretty
```

## Remote URL

```bash
npx blurkit encode https://example.com/image.jpg \
  --algorithm thumbhash \
  --format jpeg \
  --pretty
```

## Output behavior

- Without `--out`, the CLI prints a `BlurResult` to stdout.
- With `--out`, the CLI writes that raw `BlurResult` JSON to disk.

## Good fit

- one-off asset inspection
- shell scripts
- content pipelines where you only need one image result at a time
