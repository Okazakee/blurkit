---
title: Node Runtime
description: Use the sharp-backed Node runtime for local files, remote URLs, batch work, caching, and manifests.
---

# Node Runtime

`blurkit/node` is the main fully featured runtime today. It is the right choice for build scripts, CMS imports, static manifests, and server-side image processing in Node or Bun.

## Install requirement

```bash
pnpm add blurkit sharp
```

`blurkit/node` depends on `sharp` for decoding source images and rendering the final placeholder image.

## Supported inputs

The current implementation supports:

- local path strings such as `./public/hero.jpg`
- remote `http` and `https` strings
- `URL`
- `Blob`
- `ArrayBuffer`

## Example

```ts
import { encode, createMemoryCache } from 'blurkit/node'

const cache = createMemoryCache({ max: 500 })

const result = await encode('./public/hero.jpg', {
  size: 32,
  cache,
})
```

## Also available from `blurkit/node`

- `encodeMany()`
- `createMemoryCache()`
- `createManifest()`
- `writeManifest()`

## Good fit

- Static site and CMS import scripts
- Node-based image ingestion pipelines
- Manifest generation during builds
- Bun projects that can use the Node entrypoint

## Caveats

- The Node runtime requires `sharp`.
- Local path strings are only supported in Node and Bun, not in the browser or edge entrypoints.
- The root import may work in Node, but explicit `blurkit/node` imports are safer when you want predictable bundling.
