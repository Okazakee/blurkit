---
title: encodeMany()
description: Batch encode many inputs with fail-fast or settled semantics.
---

## When to use

Use `encodeMany()` when one failure should fail the whole job. Use `encodeManySettled()` when you need partial success details.

## Example

```ts
import { encodeMany, encodeManySettled } from 'blurkit/node'

const failFast = await encodeMany([
  './public/hero.jpg',
  './public/poster.jpg',
])

const settled = await encodeManySettled([
  './public/hero.jpg',
  './public/missing.jpg',
])
```

## Inputs / Options / Behavior

```ts
encodeMany(inputs: BlurKitInput[], options?: BlurKitOptions): Promise<BlurResult[]>
encodeManySettled(inputs: BlurKitInput[], options?: BlurKitOptions): Promise<BlurEncodeManySettledResult[]>
```

- Both preserve input order.
- Both apply the same `BlurKitOptions` to each input.
- `encodeMany()` uses `Promise.all` semantics.
- `encodeManySettled()` uses `Promise.allSettled` semantics.

## Limits / Caveats

- `encodeMany()` is fail-fast.
- `encodeManySettled()` includes rejected entries instead of throwing batch-level rejection.

## Next read

- [API: encode()](/docs/api/encode/)
- [API: Options](/docs/api/options/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
