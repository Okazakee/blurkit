---
title: Build-time Manifest Generation
description: Generate a blur manifest during a build so the app can load placeholders without recomputing them at runtime.
---

# Build-time manifest generation

Use this pattern when your images live in a known folder and you want to precompute placeholder data during your build or content pipeline.

## Why this shape works

You pay the image decode and encode cost once during the build, then load the resulting JSON in your app without recomputing placeholders on the client or server.

## CLI flow

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

## Programmatic flow

```ts
import { encodeMany, createManifest, writeManifest } from 'blurkit/node'

const inputs = [
  './public/images/hero.jpg',
  './public/images/poster.jpg',
]

const results = await encodeMany(inputs, { size: 32 })

const manifest = createManifest({
  '/images/hero.jpg': results[0]!,
  '/images/poster.jpg': results[1]!,
})

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

## Caveat

If your source files are not inside `/public`, make sure your manifest keys match the paths your app will actually use.
