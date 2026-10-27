---
title: encodeMany()
description: Batch encode many inputs with fail-fast or settled semantics.
kind: api
---

## Signatures

Use `encodeMany()` when one failure should fail the whole job. Use `encodeManySettled()` when you need partial success details.

## Batch encode

```ts
import { encodeMany, encodeManySettled } from 'blurkit/node'

const failFast = await encodeMany(['./public/hero.jpg', './public/poster.jpg'])

const settled = await encodeManySettled(['./public/hero.jpg', './public/missing.jpg'])
```

## Ordering and options

```ts
encodeMany(inputs: BlurKitInput[], options?: BlurKitOptions): Promise<BlurResult[]>
encodeManySettled(inputs: BlurKitInput[], options?: BlurKitOptions): Promise<BlurEncodeManySettledResult[]>
```

- Both preserve input order.
- Both apply the same `BlurKitOptions` to each input.
- `encodeMany()` uses `Promise.all` semantics.
- `encodeManySettled()` uses `Promise.allSettled` semantics.

## Failure semantics

- `encodeMany()` is fail-fast.
- `encodeManySettled()` includes rejected entries instead of throwing batch-level rejection.

## Related

- [API: encode()](/docs/api/encode/)
- [API: Options](/docs/api/options/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
