# blurkit

Universal image placeholder generation for Node, Bun, browsers, and edge runtimes.

`blurkit` takes an image input and returns a ready-to-use placeholder `dataURL` plus the underlying hash, placeholder dimensions, and source metadata. It supports both BlurHash and ThumbHash behind one API.

## Features

- BlurHash and ThumbHash support
- Runtime-specific entrypoints for Node, browser, and edge environments
- Ready-to-render `dataURL` output
- Batch encoding with `encodeMany()`
- CLI support for single images, remote URLs, and folder manifests
- Optional cache interface with an in-memory Node helper
- Manifest helpers for build-time image pipelines

## Install

```bash
npm install blurkit
```

If you use the Node or Bun runtime, install `sharp` too:

```bash
npm install sharp
```

`sharp` is not required for `blurkit/browser` or `blurkit/edge`.

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

## Choose an Entrypoint

Prefer explicit runtime imports in app code:

```ts
import { encode } from 'blurkit/node'
import { encode as encodeBrowser } from 'blurkit/browser'
import { encode as encodeEdge } from 'blurkit/edge'
```

The root import is available as a convenience wrapper:

```ts
import { encode } from 'blurkit'
```

The root import auto-selects a runtime at execution time. For libraries and production apps, explicit runtime entrypoints are safer for bundlers and clearer for readers.

## Supported Inputs

`encode()` and `encodeMany()` accept:

- `string`
- `URL`
- `File`
- `Blob`
- `ArrayBuffer`

Runtime support differs by environment:

- `blurkit/node`: local file paths, remote URLs, `URL`, `Blob`, `ArrayBuffer`
- `blurkit/browser`: remote URLs, `URL`, `File`, `Blob`, `ArrayBuffer`
- `blurkit/edge`: remote URLs, `URL`, `Blob`, `ArrayBuffer`

The browser runtime does not read local filesystem paths. Remote browser URLs must allow CORS.

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

Returns:

```ts
type BlurResult = {
  dataURL: string
  hash: string
  algorithm: 'blurhash' | 'thumbhash'
  width: number
  height: number
  meta?: {
    originalWidth: number
    originalHeight: number
    format?: string
    hasAlpha?: boolean
  }
}
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

Defaults:

- `algorithm`: `blurhash`
- `size`: `32`
- `componentX`: `4`
- `componentY`: `3`
- `outputFormat`: `png`

Notes:

- `size` controls the longest placeholder side when `width` and `height` are not both set.
- `componentX` and `componentY` apply to BlurHash encoding.
- All numeric options must be positive integers.

### `createMemoryCache(options?)`

Available from `blurkit/node`.

```ts
import { createMemoryCache, encode } from 'blurkit/node'

const cache = createMemoryCache({ max: 500 })
const result = await encode('./public/hero.jpg', { cache })
```

The built-in cache is an in-memory LRU-style cache sized by entry count.

### `createManifest(images)`

```ts
import { createManifest } from 'blurkit'

const manifest = createManifest({
  '/images/hero.jpg': result,
})
```

### `writeManifest(filePath, manifest, options?)`

Available from `blurkit` and `blurkit/node`.

```ts
import { createManifest, writeManifest } from 'blurkit'

const manifest = createManifest({
  '/images/hero.jpg': result,
})

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

`createManifest()` returns:

```ts
type BlurManifest = {
  version: 1
  algorithm?: 'blurhash' | 'thumbhash' | 'mixed'
  generatedAt: string
  images: Record<string, BlurResult>
}
```

## CLI

Encode a single local image:

```bash
npx blurkit encode ./public/hero.jpg --pretty
```

Encode a remote image:

```bash
npx blurkit encode https://example.com/image.jpg --algorithm thumbhash --format jpeg
```

Generate a manifest from a directory:

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

CLI options:

- `--algorithm <blurhash|thumbhash>`
- `--size <number>`
- `--width <number>`
- `--height <number>`
- `--format <png|jpeg>`
- `--glob <pattern>`
- `--out <file>`
- `--base-path <path>`
- `--concurrency <number>`
- `--pretty`

Single-image input prints a `BlurResult`. Directory input prints or writes a `BlurManifest`.

When no `--base-path` is provided for directory manifests, files inside a `/public/` folder are keyed from that public root.

## Runtime Notes

- `blurkit/node` and Bun rely on `sharp` for decoding and rendering.
- `blurkit/browser` decodes with DOM image APIs and renders via `<canvas>`.
- `blurkit/edge` requires `ImageDecoder` and `OffscreenCanvas` in the target runtime.
- The edge runtime currently detects PNG, JPEG, and WebP input formats.

## Example Manifest

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
