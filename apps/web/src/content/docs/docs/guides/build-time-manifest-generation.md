---
title: Build-time Manifest Generation
description: Precompute placeholder JSON during builds to avoid runtime encoding.
kind: guide
---

## When this pattern fits

Use this pattern when your image set is known at build time and runtime latency must stay low.

## Generate a manifest in a build step

```bash
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

## Wiring it into the build

Programmatic equivalent:

```ts
import { encodeMany, createManifest, writeManifest } from 'blurkit/node'

const inputs = ['./public/images/hero.jpg', './public/images/poster.jpg']
const results = await encodeMany(inputs, { size: 32 })

const manifest = createManifest(
  Object.fromEntries(inputs.map((path, i) => [path.replace('./public', ''), results[i]!])),
)

await writeManifest('./blur-manifest.json', manifest, { pretty: true })
```

- Use deterministic manifest keys that match runtime image paths.
- Build once, read many at runtime.

## Caveats

- `encodeMany()` is fail-fast.
- Key mismatches between manifest and app URLs break placeholder lookup.

## Related

- [API: Manifest Helpers](/docs/api/manifest/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
- [API: encodeMany()](/docs/api/encode-many/)
