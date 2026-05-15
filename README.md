# blurkit

[![npm version](https://img.shields.io/npm/v/blurkit.svg)](https://www.npmjs.com/package/blurkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Okazakee/blurkit/blob/main/LICENSE)
[![Release blurkit](https://github.com/Okazakee/blurkit/actions/workflows/release.yml/badge.svg)](https://github.com/Okazakee/blurkit/actions/workflows/release.yml)
[![Deploy website](https://github.com/Okazakee/blurkit/actions/workflows/website-deploy.yml/badge.svg)](https://github.com/Okazakee/blurkit/actions/workflows/website-deploy.yml)

Universal image placeholder generation for Node, Bun, Deno, browser, edge, Cloudflare, and WASM runtimes.

`blurkit` takes an image input and returns a ready-to-use placeholder `dataURL` plus the underlying hash, dimensions, and source metadata. The goal is to hide the decode, resize, hash, and render pipeline behind one practical API.

## Features

- Ready-to-use `dataURL` output
- BlurHash and ThumbHash support
- Explicit runtime entrypoints for Node, Deno, browser, edge, Cloudflare, and WASM runtimes
- Batch encoding with `encodeMany()` and `encodeManySettled()`
- CLI support for single images and folder manifests
- Cache interface with Node memory/filesystem helpers and Cloudflare Worker cache helper
- Manifest helpers for build-time and CMS pipelines

## Install

```bash
pnpm add blurkit
```

For Node and Bun usage, install `sharp` alongside the package:

```bash
pnpm add sharp
```

For Deno, install `blurkit-wasm-codecs` alongside the package since the Deno runtime uses wasm codecs for decode:

```bash
pnpm add blurkit-wasm-codecs
```

If you use `blurkit/wasm` directly, `blurkit/edge` fallback in non-native runtimes, or CLI `--backend wasm`, install wasm codecs companion package:

```bash
pnpm add blurkit-wasm-codecs
```

## Quick Start

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  size: 32,
})

console.log(result.dataURL)
console.log(result.hash)
console.log(result.meta?.originalWidth, result.meta?.originalHeight)
```

## Examples

Copy these minimal integrations as starting points:

- Next.js: [`apps/example-nextjs`](https://github.com/Okazakee/blurkit/tree/main/apps/example-nextjs)
- Astro: [`apps/example-astro`](https://github.com/Okazakee/blurkit/tree/main/apps/example-astro)

## Runtime Imports

Prefer explicit runtime imports in application code:

```ts
import { encode } from 'blurkit/node'
import { encode as encodeBrowser } from 'blurkit/browser'
import { encode as encodeDeno } from 'blurkit/deno'
import { encode as encodeEdge } from 'blurkit/edge'
import { encode as encodeCloudflare } from 'blurkit/cloudflare'
import { encode as encodeWasm } from 'blurkit/wasm'
```

The root import is available as a convenience wrapper:

```ts
import { encode } from 'blurkit'
```

Use the root import when convenience matters more than strict runtime control. For libraries and production apps, prefer the explicit runtime entrypoints.

## Runtime Picker

- `blurkit/node`: Node/Bun/server pipelines, local path support, sharp-backed.
- `blurkit/deno`: Deno runtime with local path support, wasm-backed decode, canvas render.
- `blurkit/browser`: browser/client uploads (`File`/`Blob`) with CORS-compatible remote URL support.
- `blurkit/edge`: generic worker runtimes; native decode first, wasm fallback second.
- `blurkit/cloudflare`: Cloudflare Workers with `cf.image`; remote URLs only.
- `blurkit/wasm`: runtimes without native decode APIs; PNG/JPEG/WebP decode.

## CLI

Encode a single local image:

```bash
npx blurkit encode ./public/hero.jpg --pretty
```

Encode with wasm backend:

```bash
npx blurkit encode ./public/hero.jpg --backend wasm --pretty
```

`--backend wasm` requires `blurkit-wasm-codecs`.

Encode a remote image:

```bash
npx blurkit encode https://example.com/image.jpg --algorithm thumbhash --format jpeg
```

Generate a manifest for a folder:

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

Single-image input prints a `BlurResult` or writes that JSON directly with `--out`. Directory input produces a `BlurManifest`.

## Manifest Example

```json
{
  "version": 1,
  "algorithm": "blurhash",
  "generatedAt": "2026-05-12T00:00:00.000Z",
  "images": {
    "/images/hero.jpg": {
      "dataURL": "data:image/png;base64,...",
      "hash": "L9TSUA~qfQ~q~qoffQoffQfQfQfQ",
      "algorithm": "blurhash",
      "width": 32,
      "height": 18,
      "meta": {
        "originalWidth": 1920,
        "originalHeight": 1080,
        "format": "jpeg",
        "hasAlpha": false
      }
    }
  }
}
```

## API Overview

### `encode()`

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  algorithm: 'blurhash',
  size: 32,
  outputFormat: 'png',
})
```

### `encodeMany()`

```ts
import { encodeMany } from 'blurkit/node'

const results = await encodeMany([
  './public/hero.jpg',
  './public/poster.jpg',
])
```

`encodeMany()` is intentionally fail-fast and mirrors `Promise.all()`.

### `encodeManySettled()`

```ts
import { encodeManySettled } from 'blurkit/node'

const settled = await encodeManySettled([
  './public/hero.jpg',
  './public/missing.jpg',
])
```

`encodeManySettled()` returns ordered `fulfilled`/`rejected` results for partial success workflows.

### `createMemoryCache()`

```ts
import { createMemoryCache, encode } from 'blurkit/node'

const cache = createMemoryCache({ max: 500 })
const result = await encode('./public/hero.jpg', { cache })
```

### Manifest Helpers

```ts
import { createManifest, writeManifest } from 'blurkit'

const manifest = createManifest({
  '/images/hero.jpg': result,
})

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

## Runtime Notes

- Node and Bun use the `blurkit/node` entrypoint and rely on `sharp` for image decoding and rendering.
- Deno uses the `blurkit/deno` entrypoint with wasm codecs for decode and native `OffscreenCanvas` for rendering. Requires `blurkit-wasm-codecs`.
- The browser runtime supports `File`, `Blob`, `ArrayBuffer`, and remote URLs that permit CORS.
- The edge runtime uses native `ImageDecoder` + `OffscreenCanvas` when available, then falls back to the wasm runtime.
- Edge fallback, `blurkit/wasm`, and `blurkit/deno` require `blurkit-wasm-codecs`.
- The Cloudflare runtime is optimized for Worker image transforms.
- The wasm runtime supports PNG/JPEG/WebP decode in runtimes without native decoding APIs.
- The root import auto-selects a runtime, but explicit runtime imports are safer for bundlers and framework apps.

## Roadmap / Deferred

These are intentionally not documented as current support:

- Framework-specific adapters such as Next.js convenience helpers
- Additional manifest output formats and tighter build-tool integrations

## Publishing

Library releases and website deployments are handled by separate workflows.

### Library Release (`.github/workflows/release.yml`)

1. Bump `packages/blurkit/package.json` and `packages/blurkit-wasm-codecs/package.json` to the version you want to publish.
2. Push a matching stable tag like `v0.1.5` or `0.1.5`.
3. The workflow validates tag/version match for both packages, publishes `blurkit-wasm-codecs` then `blurkit`, generates lib-scoped release notes, and creates/updates the GitHub Release.

Repository setup:

- Configure both `blurkit` and `blurkit-wasm-codecs` for npm trusted publishing against `Okazakee/blurkit` and the `release.yml` workflow.
- You can do that in the npm UI or with:
  - `npm trust github blurkit --repo Okazakee/blurkit --file release.yml`
  - `npm trust github blurkit-wasm-codecs --repo Okazakee/blurkit --file release.yml`
- Trusted publishing requires a current npm CLI with `npm trust` support and account-level 2FA enabled when you create the trust relationship.
- The workflow accepts only stable semver tags (`vX.Y.Z` or `X.Y.Z`) and fails if the tag does not match both `packages/blurkit/package.json` and `packages/blurkit-wasm-codecs/package.json`.
- If an exact version is already on npm for a package, publish for that package is skipped.
- GitHub Release notes are generated from commits scoped to `packages/blurkit` and `packages/blurkit-wasm-codecs` and include only product-impacting conventional commit types (`feat`, `fix`, `perf`, `refactor`, plus breaking changes).
- No long-lived `NPM_TOKEN` secret is required for publishing.

### Library Size Report (`.github/workflows/library-size-report.yml`)

- Runs on pull requests and release tag pushes.
- Produces `artifacts/library-size-report.json` and `artifacts/library-size-report.md` as downloadable workflow artifacts.
- Use these artifacts to review package size deltas before merging and at release time.

### Website Deploy (`.github/workflows/website-deploy.yml`)

- Automatic deploy trigger: push to `main` with website path changes (`apps/web/**`) and a commit subject matching `^(feat|fix|docs|refactor|perf)\(website\):`.
- Non-matching commit subjects intentionally skip deployment, even when website files changed.
- Manual `workflow_dispatch` is available and bypasses the commit-subject gate for testing or recovery deploys.
