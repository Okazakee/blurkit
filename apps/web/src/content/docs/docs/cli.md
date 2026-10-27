---
title: CLI Overview
description: Generate one result or one manifest from the shell using sharp or wasm backend.
---

## Command surface

Use the CLI when you want JSON output without writing a custom script. Run it through your package runner; a global install is not required.

```bash
npx blurkit encode <input>
# or
pnpm exec blurkit encode <input>
```

## Encode one image

```bash
npx blurkit encode ./public/hero.jpg --pretty
```

Common flags:

- `--algorithm blurhash|thumbhash`
- `--size <number>`
- `--width <number>`
- `--height <number>`
- `--format png|jpeg`
- `--glob <pattern>`
- `--out <file>`
- `--base-path <path>`
- `--concurrency <number>`
- `--backend sharp|wasm`
- `--pretty`

Behavior:

- local file input returns one `BlurResult` JSON object
- local directory input returns one `BlurManifest` JSON object, with or without `--glob`
- the default directory selection is `**/*.{jpg,jpeg,png,webp}`; `--glob` replaces it
- remote URL input behaves as single-image mode
- output goes to stdout unless `--out <file>` is set
- backend defaults to `sharp`; use `--backend wasm` to force the wasm path

## Backend notes

- `--backend sharp` requires `sharp`.
- `--backend wasm` supports PNG/JPEG/WebP decode.
- `--backend wasm` requires `blurkit-wasm-codecs` installed.
- `--glob` is valid only for local directory input.

## Related

- [CLI: Single Image](/docs/cli/single-image/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
- [Node Runtime](/docs/runtimes/node/)
