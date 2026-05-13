---
title: encodeMany()
description: Batch encode many inputs with fail-fast Promise.all semantics.
---

## When to use

Use `encodeMany()` when one job must process multiple images and fail the job if any input fails.

## Example

```ts
import { encodeMany } from 'blurkit/node'

const results = await encodeMany(
  ['./public/hero.jpg', './public/poster.jpg'],
  { size: 32 },
)
```

## Inputs / Options / Behavior

```ts
encodeMany(inputs: BlurKitInput[], options?: BlurKitOptions): Promise<BlurResult[]>
```

- Uses `Promise.all` semantics.
- Preserves input order in output array.
- Applies the same `BlurKitOptions` to each input.

## Limits / Caveats

- Fail-fast: one rejection rejects the whole batch.
- No partial-success envelope is returned.

## Next read

- [API: encode()](/docs/api/encode/)
- [API: Options](/docs/api/options/)
- [CLI: Manifest Generation](/docs/cli/manifest-generation/)
