---
title: encodeMany()
description: Batch placeholder generation with fail-fast behavior.
---

# API: encodeMany()

```ts
encodeMany(inputs: BlurKitInput[], options?: BlurKitOptions): Promise<BlurResult[]>
```

`encodeMany()` is intentionally fail-fast and mirrors `Promise.all()`.

If any single image fails, the whole call rejects. Use it when batch failure should stop a build or import pipeline.

## Example

```ts
import { encodeMany } from 'blurkit/node'

const results = await encodeMany(
  [
    './public/hero.jpg',
    './public/poster.jpg',
  ],
  {
    size: 32,
  },
)
```

## Good fit

- build-time placeholder generation
- content import scripts
- batch processing where one bad image should fail the job
