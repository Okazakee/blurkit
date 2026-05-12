# blurkit

Universal image placeholder generation for Node, Bun, browser, and edge runtimes.

`blurkit` takes an image input and returns a ready-to-use placeholder `dataURL` plus the underlying hash, dimensions, and source metadata. The goal is to hide the decode, resize, hash, and render pipeline behind one practical API.

## Features

- Ready-to-use `dataURL` output
- BlurHash and ThumbHash support
- Explicit runtime entrypoints for Node, browser, and edge runtimes
- Batch encoding with `encodeMany()`
- CLI support for single images and folder manifests
- Optional cache interface with a Node memory cache helper
- Manifest helpers for build-time and CMS pipelines

## Install

```bash
pnpm add blurkit
```

For Node and Bun usage, install `sharp` alongside the package:

```bash
pnpm add sharp
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

## Runtime Imports

Prefer explicit runtime imports in application code:

```ts
import { encode } from 'blurkit/node'
import { encode as encodeBrowser } from 'blurkit/browser'
import { encode as encodeEdge } from 'blurkit/edge'
```

The root import is available as a convenience wrapper:

```ts
import { encode } from 'blurkit'
```

Use the root import when convenience matters more than strict runtime control. For libraries and production apps, prefer the explicit runtime entrypoints.

## CLI

Encode a single local image:

```bash
npx blurkit encode ./public/hero.jpg --pretty
```

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
- The browser runtime supports `File`, `Blob`, `ArrayBuffer`, and remote URLs that permit CORS.
- The edge runtime supports remote URLs, `ArrayBuffer`, and `Blob`, but depends on `ImageDecoder` and `OffscreenCanvas` being available in the target platform.
- The root import auto-selects a runtime, but explicit runtime imports are safer for bundlers and framework apps.

## Roadmap / Deferred

These are intentionally not documented as current support:

- Persistent cache adapters beyond the in-memory Node helper
- Broader edge decoding coverage across more image formats and runtimes
- Framework-specific adapters such as Next.js convenience helpers
- Additional manifest output formats and tighter build-tool integrations
