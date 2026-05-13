---
title: CMS Import Pipeline
description: Generate placeholders during Node import jobs before writing CMS records.
---

## When to use

Use this pattern when your importer already fetches images and writes structured records.

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

## Inputs / Options / Behavior

- Remote input is fetched in Node runtime.
- Placeholder and source metadata are emitted in one result.
- The same pattern works for DB, CMS, or search index writes.

## Limits / Caveats

- Import job must handle network and decode failures.
- Batch jobs should decide between fail-fast and per-item error handling.

## Next read

- [Node Runtime](/docs/runtimes/node/)
- [API: Result](/docs/api/result/)
- [API: Cache](/docs/api/cache/)
