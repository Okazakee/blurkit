---
title: encode()
description: Encode one image input into a BlurResult placeholder object.
---

## When to use

Use `encode()` when one image should produce one placeholder result.

## Example

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  algorithm: 'blurhash',
  size: 32,
  outputFormat: 'png',
})
```

## Inputs / Options / Behavior

```ts
encode(input: BlurKitInput, options?: BlurKitOptions): Promise<BlurResult>

type BlurKitInput = string | URL | File | Blob | ArrayBuffer
```

- Runtime entrypoint determines which input forms are valid at runtime.
- `options` controls algorithm, target dimensions, output format, and optional cache.
- Returns a `BlurResult` with `dataURL`, `hash`, dimensions, algorithm, and optional `meta`.

## Limits / Caveats

- Input support is runtime-specific.
- Remote URL input can fail from network or CORS constraints.

## Next read

- [API: Options](/docs/api/options/)
- [API: Result](/docs/api/result/)
- [Node Runtime](/docs/runtimes/node/)
