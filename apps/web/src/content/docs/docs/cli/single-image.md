---
title: Single Image
description: Generate one BlurResult JSON object from a local path or remote URL.
kind: cli
---

## When to use single-image mode

Use this flow when one asset must be encoded and consumed immediately.

## Write JSON to stdout

```bash
npx blurkit encode ./public/hero.jpg --pretty
```

## Remote and wasm variants

Alternative remote input example:

```bash
npx blurkit encode https://example.com/image.jpg --algorithm thumbhash --format jpeg --pretty
```

Wasm backend example:

```bash
npx blurkit encode ./public/hero.jpg --backend wasm --pretty
```

- Without `--out`, JSON is written to stdout.
- With `--out`, JSON is written to the given file path.
- Backend defaults to `sharp`; use `--backend wasm` for wasm decode path.
- `--backend wasm` requires `blurkit-wasm-codecs` installed.

## Behavior notes

- Remote URL mode can fail on network errors.
- Single-image mode does not create a manifest envelope.

## Related

- [CLI Overview](/docs/cli/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
- [API: Result](/docs/api/result/)
