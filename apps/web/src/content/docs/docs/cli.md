---
title: CLI Overview
description: Generate one result or one manifest from the shell using sharp or wasm backend.
---

## When to use

Use the CLI when you want JSON output without writing a custom script.

## Example

```bash
blurkit encode ./public/hero.jpg --pretty
```

## Inputs / Options / Behavior

Command surface:

```bash
blurkit encode <input>
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
- local directory input + `--glob` returns one `BlurManifest` JSON object
- remote URL input behaves as single-image mode
- backend defaults to `sharp`; use `--backend wasm` to force wasm path

## Limits / Caveats

- `--backend sharp` requires `sharp`.
- `--backend wasm` supports PNG/JPEG/WebP decode.
- `--backend wasm` requires `blurkit-wasm-codecs` installed.
- `--glob` is valid only for local directory input.

## Next read

- [CLI: Single Image](/docs/cli/single-image/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
- [Node Runtime](/docs/runtimes/node/)
