# blurkit

[![npm version](https://img.shields.io/npm/v/blurkit.svg)](https://www.npmjs.com/package/blurkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Okazakee/blurkit/blob/main/LICENSE)
[![Release blurkit](https://github.com/Okazakee/blurkit/actions/workflows/release.yml/badge.svg)](https://github.com/Okazakee/blurkit/actions/workflows/release.yml)
[![Deploy website](https://github.com/Okazakee/blurkit/actions/workflows/website-deploy.yml/badge.svg)](https://github.com/Okazakee/blurkit/actions/workflows/website-deploy.yml)

Universal image placeholder generation for Node, Bun, Deno, browsers, edge runtimes, Cloudflare Workers, and WASM-first runtimes.

`blurkit` takes an image input and returns a placeholder `dataURL` plus hash text, placeholder dimensions, and source metadata.

## Features

- BlurHash and ThumbHash support
- Runtime-specific entrypoints for Node, Deno, browser, edge, Cloudflare, and WASM
- Ready-to-render `dataURL` output
- `encodeMany()` fail-fast batches and `encodeManySettled()` partial-success batches
- CLI support for single images, remote URLs, and folder manifests
- Cache interface with memory, filesystem, and Cloudflare Worker cache helpers
- Manifest helpers for build-time image pipelines

## Install

```bash
npm install blurkit
```

`sharp` is listed as an optional dependency and is required only for Node/Bun runtime paths (`blurkit/node`, CLI, or root import in Node).

`blurkit-wasm-codecs` is required for `blurkit/deno`, `blurkit/wasm`, `blurkit/edge` fallback, and CLI `--backend wasm`.

If your install skipped optional dependencies (for example `npm install --omit=optional`), install `sharp` manually:

```bash
npm install sharp
```

If you use `blurkit/deno`, `blurkit/wasm`, `blurkit/edge` fallback in non-native runtimes, or CLI `--backend wasm`, install:

```bash
npm install blurkit-wasm-codecs
```

## Quick Start (Node)

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', { size: 32 })

console.log(result.dataURL)
console.log(result.hash)
```

## Examples

Copy these minimal integrations as starting points:

- Next.js: [`apps/example-nextjs`](https://github.com/Okazakee/blurkit/tree/main/apps/example-nextjs)
- Astro: [`apps/example-astro`](https://github.com/Okazakee/blurkit/tree/main/apps/example-astro)

## Choose an Entrypoint

Use explicit runtime entrypoints in production:

```ts
import { encode } from 'blurkit/node'
import { encode as encodeBrowser } from 'blurkit/browser'
import { encode as encodeDeno } from 'blurkit/deno'
import { encode as encodeEdge } from 'blurkit/edge'
import { encode as encodeCloudflare } from 'blurkit/cloudflare'
import { encode as encodeWasm } from 'blurkit/wasm'
```

Root import is still supported:

```ts
import { encode } from 'blurkit'
```

Root import now resolves via static package export conditions (`node`, `browser`, `worker`) instead of runtime dynamic detection.

## Supported Inputs

Shared `BlurKitInput` includes:

- `string`
- `URL`
- `File`
- `Blob`
- `ArrayBuffer`

Runtime support differs:

- `blurkit/node`: local file paths, remote URLs, `URL`, `Blob`, `ArrayBuffer`
- `blurkit/deno`: local file paths, remote URLs, `URL`, `Blob`, `ArrayBuffer` (wasm-backed decode, canvas render)
- `blurkit/browser`: remote URLs, `URL`, `File`, `Blob`, `ArrayBuffer`
- `blurkit/edge`: remote URLs, `URL`, `Blob`, `ArrayBuffer` (native APIs first, wasm fallback)
- `blurkit/cloudflare`: remote URLs and `URL`
- `blurkit/wasm`: remote URLs, `URL`, `Blob`, `ArrayBuffer`

## API

### `encode(input, options?)`

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  algorithm: 'blurhash',
  size: 32,
  outputFormat: 'png',
})
```

### `encodeMany(inputs, options?)`

```ts
import { encodeMany } from 'blurkit/node'

const results = await encodeMany([
  './public/hero.jpg',
  './public/poster.jpg',
])
```

`encodeMany()` is fail-fast and mirrors `Promise.all()`.

### `encodeManySettled(inputs, options?)`

```ts
import { encodeManySettled } from 'blurkit/node'

const results = await encodeManySettled([
  './public/hero.jpg',
  './public/missing.jpg',
])

for (const result of results) {
  if (result.status === 'fulfilled') {
    console.log(result.value.hash)
  } else {
    console.error(result.reason)
  }
}
```

### Options

```ts
type BlurKitOptions = {
  algorithm?: 'blurhash' | 'thumbhash'
  size?: number
  width?: number
  height?: number
  componentX?: number
  componentY?: number
  outputFormat?: 'png' | 'jpeg'
  cache?: BlurKitCache
}
```

### Cache Helpers

Node helpers from `blurkit/node`:

```ts
import { createMemoryCache, createFilesystemCache } from 'blurkit/node'

const memoryCache = createMemoryCache({ max: 500 })
const filesystemCache = createFilesystemCache({
  dir: './.cache/blurkit',
  ttlMs: 60_000,
})
```

Cloudflare Worker helper from `blurkit/cloudflare`:

```ts
import { createCloudflareCache } from 'blurkit/cloudflare'

const cache = createCloudflareCache({
  name: 'blurkit',
  ttlSeconds: 300,
})
```

### `createManifest(images)`

```ts
import { createManifest } from 'blurkit'
```

### `writeManifest(filePath, manifest, options?)`

`writeManifest()` is Node-only. Use `blurkit/node` in browser/worker code.

## Deno Runtime Notes

- `blurkit/deno` uses wasm codecs for image decode and native `OffscreenCanvas` for rendering.
- Supports local filesystem paths, remote URLs, `URL`, `Blob`, and `ArrayBuffer`.
- Does not require `sharp`.
- `blurkit-wasm-codecs` must be installed to execute deno runtime paths.

## Cloudflare Runtime Notes

- `blurkit/cloudflare` uses Cloudflare image transformations (`cf.image`).
- It supports remote URL inputs only.
- It returns normal `BlurResult` shape and supports cache integration.
- The `hash` value is deterministic but Cloudflare-generated (not decoded via `ImageDecoder`).

## Edge Runtime Notes

- `blurkit/edge` uses `ImageDecoder` + `OffscreenCanvas` when available.
- If native APIs are unavailable, `blurkit/edge` automatically falls back to the wasm runtime path.
- Edge fallback requires `blurkit-wasm-codecs`.
- For Cloudflare Workers, prefer `blurkit/cloudflare`.

## WASM Runtime Notes

- `blurkit/wasm` supports PNG, JPEG, and WebP decode.
- It accepts remote URLs, `URL`, `Blob`, and `ArrayBuffer`.
- Local filesystem path strings are not supported in `blurkit/wasm`.
- `blurkit-wasm-codecs` must be installed to execute wasm runtime paths.

## CLI

Encode a local image:

```bash
npx blurkit encode ./public/hero.jpg --pretty
```

Encode a remote image:

```bash
npx blurkit encode https://example.com/image.jpg --algorithm thumbhash --format jpeg
```

Encode with the wasm backend:

```bash
npx blurkit encode ./public/hero.jpg --backend wasm --pretty
```

Generate a manifest:

```bash
npx blurkit encode ./public --glob "**/*.{jpg,jpeg,png,webp}" --out blur-manifest.json --pretty
```

CLI backend defaults to `sharp`; set `--backend wasm` to force the wasm path.
`--backend wasm` requires `blurkit-wasm-codecs`.

## Limits and Caveats

- Deno runtime uses wasm decode + canvas render and supports local file paths.
- Node runtime requires `sharp` (installed automatically unless optional dependencies are skipped).
- Browser runtime rejects local filesystem path strings.
- Browser remote URL decoding depends on CORS.
- Edge runtime prefers native decode APIs and falls back to wasm when unavailable.
- WASM runtime decode support is limited to PNG, JPEG, and WebP.
- Deno, edge fallback, and wasm runtime paths require `blurkit-wasm-codecs`.
- `encodeMany()` is fail-fast; use `encodeManySettled()` for partial success.
- Root import uses static condition resolution; explicit runtime subpaths are still recommended for clarity.
