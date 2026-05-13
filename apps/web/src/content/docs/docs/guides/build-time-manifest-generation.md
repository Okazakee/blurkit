---
title: Build-time Manifest Generation
description: Precompute placeholder JSON during builds to avoid runtime encoding.
---

## When to use

Use this pattern when your image set is known at build time and runtime latency must stay low.

## Example

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

## Inputs / Options / Behavior

Programmatic equivalent:

```ts
import { encodeMany, createManifest, writeManifest } from 'blurkit/node'

const inputs = ['./public/images/hero.jpg', './public/images/poster.jpg']
const results = await encodeMany(inputs, { size: 32 })

const manifest = createManifest({
  '/images/hero.jpg': results[0]!,
  '/images/poster.jpg': results[1]!,
})

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

- Use deterministic manifest keys that match runtime image paths.
- Build once, read many at runtime.

## Limits / Caveats

- `encodeMany()` is fail-fast.
- Key mismatches between manifest and app URLs break placeholder lookup.

## Next read

- [API: Manifest Helpers](/docs/api/manifest/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
- [API: encodeMany()](/docs/api/encode-many/)
