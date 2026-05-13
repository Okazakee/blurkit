---
title: Manifest Helpers
description: Use createManifest() and writeManifest() to persist many BlurResult entries.
---

## When to use

Use manifest helpers when you precompute placeholders and need one stable JSON file for runtime lookup.

## Example

```ts
import { createManifest, writeManifest } from 'blurkit'

const manifest = createManifest({
  '/images/hero.jpg': result,
})

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

## Inputs / Options / Behavior

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

## Limits / Caveats

- Path key strategy is chosen by caller when creating `images` map.
- Manifest helpers do not validate downstream URL conventions.

## Next read

- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
- [API: Result](/docs/api/result/)
- [Guide: Build-time Manifest Generation](/docs/guides/build-time-manifest-generation/)
