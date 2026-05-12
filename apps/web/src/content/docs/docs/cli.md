---
title: CLI Overview
description: Use the blurkit CLI for single-image JSON output or folder-wide manifest generation.
---

# CLI Overview

The CLI wraps the Node runtime and is designed for scripts, build steps, and ad hoc placeholder generation from the shell.

## Install

The CLI depends on the Node runtime, so install `sharp` alongside `blurkit` in Node or Bun environments.

```bash
pnpm add blurkit sharp
```

## Commands

The current CLI surface is:

```bash
blurkit encode <input>
```

## Common flags

- `--algorithm blurhash|thumbhash`
- `--size <number>`
- `--width <number>`
- `--height <number>`
- `--format png|jpeg`
- `--glob <pattern>`
- `--out <file>`
- `--base-path <path>`
- `--concurrency <number>`
- `--pretty`

## What to read next

- [Single Image](/docs/cli/single-image/) for one-off JSON output
- [Manifest Generation](/docs/cli/manifest-generation/) for batch workflows
- [Node Runtime](/docs/runtimes/node/) for the underlying runtime behavior
