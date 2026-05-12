---
title: Manifest Helpers
description: Reference for createManifest(), writeManifest(), and the BlurManifest shape.
---

# API: Manifest Helpers

Use the manifest helpers when you want to persist or assemble many `BlurResult` objects into a stable JSON structure.

## Helpers

```ts
createManifest(images: Record<string, BlurResult>): BlurManifest
writeManifest(filePath: string, manifest: BlurManifest, options?: { pretty?: boolean }): Promise<void>
```

## BlurManifest shape

```ts
interface BlurManifest {
  version: 1
  algorithm?: 'blurhash' | 'thumbhash' | 'mixed'
  generatedAt: string
  images: Record<string, BlurResult>
}
```

The CLI uses this shape for directory encoding. Files under `/public` default to public URL-style keys such as `/images/hero.jpg`. Other folders use normalized relative paths unless you pass `--base-path`.

## Example

```ts
import { createManifest, writeManifest } from 'blurkit'

const manifest = createManifest({
  '/images/hero.jpg': result,
})

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

`createManifest()` automatically sets the manifest version and infers `algorithm` as one value or `mixed`.
