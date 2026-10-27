---
title: Manifest Helpers
description: Use createManifest() and writeManifest() to persist many BlurResult entries.
---

## Manifest shape

Use manifest helpers when you precompute placeholders and need one stable JSON file for runtime lookup.

## Create and write a manifest

```ts
import { encode } from 'blurkit/node'
import { createManifest, writeManifest } from 'blurkit/node'

const result = await encode('./public/hero.jpg')
const manifest = createManifest({
  '/images/hero.jpg': result,
})

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

## Signatures and runtime support

```ts
createManifest(images: Record<string, BlurResult>): BlurManifest
writeManifest(filePath: string, manifest: BlurManifest, options?: { pretty?: boolean }): Promise<void>

interface BlurManifest {
  version: 1
  algorithm?: 'blurhash' | 'thumbhash' | 'mixed'
  generatedAt: string
  images: Record<string, BlurResult>
}
```

- `createManifest()` infers `algorithm` as single value or `mixed`.
- `writeManifest()` creates parent directories and writes UTF-8 JSON.
- `createManifest()` has no filesystem dependency: `blurkit/node`, `blurkit/deno`, and the root `blurkit` import all export it. The `blurkit/browser`, `blurkit/edge`, `blurkit/cloudflare`, and `blurkit/wasm` subpaths do not re-export it, so import it from the root there.
- `writeManifest()` only writes files in `blurkit/node` and `blurkit/deno`; the browser and edge root exports expose it as a function that throws.
- In browser or worker code, call `createManifest()` and persist the JSON with your own storage layer (R2, KV, an API route, and so on).

## Caveats

- Path key strategy is chosen by caller when creating `images` map.
- Manifest helpers do not validate downstream URL conventions.

## Related

- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
- [API: Result](/docs/api/result/)
- [Guide: Build-time Manifest Generation](/docs/guides/build-time-manifest-generation/)
