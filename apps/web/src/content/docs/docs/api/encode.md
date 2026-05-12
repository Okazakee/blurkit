---
title: encode()
description: The main API for turning one image input into a BlurResult.
---

# API: encode()

```ts
encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult>
```

Use `encode()` when one image input should become a ready-to-use placeholder `dataURL`.

## Input shape

```ts
type BlurKitInput =
  | string
  | URL
  | File
  | Blob
  | ArrayBuffer
```

The exact supported inputs still depend on the runtime entrypoint you import.

## Example

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  algorithm: 'blurhash',
  size: 32,
  outputFormat: 'png',
})
```

## Returns

`encode()` resolves to a `BlurResult` containing:

- `dataURL`
- `hash`
- `algorithm`
- `width`
- `height`
- optional `meta`

## Related pages

- [API: Options](/docs/api/options/)
- [API: Result](/docs/api/result/)
- [Node Runtime](/docs/runtimes/node/)
