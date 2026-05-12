---
title: CMS Import Pipeline
description: Generate placeholders during Node-based import jobs before writing records to a CMS or database.
---

# CMS import pipeline

Use the Node runtime when you are importing assets into a CMS, content store, or relational database and want to persist blur metadata at the same time.

## Example

```ts
import { encode } from 'blurkit/node'

async function processImage(url: string) {
  const result = await encode(url, {
    algorithm: 'blurhash',
    size: 32,
  })

  return {
    blur_data_url: result.dataURL,
    blur_hash: result.hash,
    blur_algorithm: result.algorithm,
    image_width: result.meta?.originalWidth,
    image_height: result.meta?.originalHeight,
  }
}
```

## Why this shape works

You keep the image processing in the import job, then persist all placeholder and dimension data next to the original asset record.

## Caveat

Remote inputs still need to be reachable from the process running the import script, and failed images will reject the encode call unless you catch and handle them yourself.
