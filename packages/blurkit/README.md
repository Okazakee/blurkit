# blurkit

[![npm version](https://img.shields.io/npm/v/blurkit.svg)](https://www.npmjs.com/package/blurkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Okazakee/blurkit/blob/main/LICENSE)

Universal image placeholder generation for Node, Bun, Deno, browsers, edge runtimes, Cloudflare Workers, and WASM-first runtimes.

Takes an image, returns a placeholder `dataURL` plus the hash, dimensions, and source metadata.

**Docs:** <https://blurkit.okazakee.dev/docs/> · **Repository:** <https://github.com/Okazakee/blurkit>

## Install

```bash
npm install blurkit
```

### Sharp (Node and Bun only)

`blurkit/browser`, `blurkit/deno`, `blurkit/edge`, `blurkit/wasm`, and `blurkit/cloudflare` do not use Sharp.

`blurkit/node` and the root import in Node/Bun need it at runtime:

- Supported range: `>=0.34.5 <0.36.0` (verified against 0.34.x and 0.35.x).
- It is declared as an optional dependency and optional peer dependency, so it installs automatically unless optional dependencies are skipped.
- Skipped optional deps? Run `npm install sharp`.

### WASM codecs

```bash
npm install blurkit-wasm-codecs
```

Required for `blurkit/deno`, `blurkit/wasm`, the `blurkit/edge` fallback, and CLI `--backend wasm`.

## Quick start

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', { size: 32 })

console.log(result.dataURL)
console.log(result.hash)
```

`result.dataURL` is ready for an image `src` or `blurDataURL`. `size` sets the longest side and preserves the aspect ratio.

## Entrypoints

| Import               | Runtime                        | Extra package                          |
| -------------------- | ------------------------------ | -------------------------------------- |
| `blurkit/node`       | Node, Bun                      | `sharp`                                |
| `blurkit/deno`       | Deno                           | `blurkit-wasm-codecs`                  |
| `blurkit/browser`    | Browsers                       | —                                      |
| `blurkit/edge`       | Worker-style runtimes          | `blurkit-wasm-codecs` for the fallback |
| `blurkit/cloudflare` | Cloudflare Workers             | —                                      |
| `blurkit/wasm`       | Runtimes without native decode | `blurkit-wasm-codecs`                  |

```ts
import { encode } from 'blurkit/node'
import { encode as encodeBrowser } from 'blurkit/browser'
```

The root import (`import { encode } from 'blurkit'`) resolves through export conditions (`node`, `browser`, `worker`, `deno`), not runtime detection. Prefer explicit entrypoints in application code.

Full matrix, inputs, and CI coverage: <https://blurkit.okazakee.dev/docs/installation/#runtime-compatibility-matrix>.

## API

### `encode(input, options?)`

```ts
const result = await encode('./public/hero.jpg', {
  algorithm: 'blurhash',
  size: 32,
  outputFormat: 'png',
})
```

Options: `algorithm`, `size`, `width`, `height`, `componentX`, `componentY`, `outputFormat`, `cache`.

### `encodeMany()` and `encodeManySettled()`

```ts
import { encodeMany, encodeManySettled } from 'blurkit/node'

const results = await encodeMany(['./hero.jpg', './poster.jpg'])

const settled = await encodeManySettled(['./hero.jpg', './missing.jpg'])
for (const entry of settled) {
  if (entry.status === 'fulfilled') console.log(entry.value.hash)
  else console.error(entry.reason)
}
```

`encodeMany()` mirrors `Promise.all()`; `encodeManySettled()` mirrors `Promise.allSettled()` and keeps input order.

### Cache helpers

```ts
import { createMemoryCache, createFilesystemCache } from 'blurkit/node'

const memory = createMemoryCache({ max: 500 })
const disk = createFilesystemCache({ dir: './.cache/blurkit', ttlMs: 60_000 })
```

| Helper                    | Available from                 |
| ------------------------- | ------------------------------ |
| `createMemoryCache()`     | `blurkit/node`, `blurkit/deno` |
| `createFilesystemCache()` | `blurkit/node`, `blurkit/deno` |
| `createCloudflareCache()` | `blurkit/cloudflare`           |

### Manifests

```ts
import { encode } from 'blurkit/node'
import { createManifest, writeManifest } from 'blurkit/node'

const result = await encode('./public/hero.jpg')
const manifest = createManifest({ '/images/hero.jpg': result })

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

`createManifest()` is available from `blurkit/node`, `blurkit/deno`, and the root import. `writeManifest()` writes files on Node/Bun and Deno only; in browser and worker code the root export throws when called, so persist `createManifest()` output yourself.

## Runtime notes

- **Node/Bun**: `sharp` decode; local paths, URLs, `Blob`, `ArrayBuffer`, `Uint8Array`/`Buffer`. Missing Sharp throws `BLURKIT_MISSING_SHARP`.
- **Deno**: wasm decode, native `OffscreenCanvas` render when available, wasm render otherwise. No Sharp.
- **Browser**: `File`/`Blob` and CORS-enabled URLs. Local path strings are rejected.
- **Edge**: picks native `ImageDecoder` + `OffscreenCanvas` when both exist, otherwise wasm. Native decode errors are not retried with wasm.
- **Cloudflare**: transforms through `cf.image`; remote URLs only. `hash` is an opaque `cfbh:`/`cfth:` SHA-256 identifier, not a portable BlurHash/ThumbHash, so use `dataURL` for rendering. Its cache keys on transformed bytes, so a hit still performs the upstream transform.
- **WASM**: PNG/JPEG/WebP decode only; no local paths.

Per-runtime guides: <https://blurkit.okazakee.dev/docs/runtimes/node/>.

## CLI

```bash
npx blurkit encode ./public/hero.jpg --pretty
npx blurkit encode ./public --glob "**/*.{jpg,jpeg,png,webp}" --out blur-manifest.json --pretty
```

Backend defaults to `sharp`; `--backend wasm` requires `blurkit-wasm-codecs`.

## Errors and limits

- Fail-fast batches: `encodeMany()`.
- Missing dependencies raise `BLURKIT_MISSING_SHARP` / `BLURKIT_MISSING_WASM_CODECS`.
- `result.width`/`height` describe the encoded image; ThumbHash output can render at different pixel dimensions.
- Cloudflare `meta.originalWidth`/`originalHeight` fall back to the requested transform size when the image-info lookup fails.

Full caveats: <https://blurkit.okazakee.dev/docs/limits/>.
