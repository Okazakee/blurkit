---
title: Edge Runtime
description: Use the edge runtime when you need browser-like platform APIs without depending on sharp.
---

# Edge Runtime

`blurkit/edge` is the lightweight runtime for platforms that expose browser-like APIs but cannot rely on native Node dependencies such as `sharp`.

## Example

```ts
import { encode } from 'blurkit/edge'

const result = await encode('https://example.com/image.jpg')
```

## Current limits

- The current implementation relies on `ImageDecoder`.
- It also requires `OffscreenCanvas` for rendering the placeholder image.
- It is best suited to worker-style runtimes that provide those APIs.
- It does not support local filesystem paths.

## Supported inputs

- remote URL strings
- `URL`
- `Blob`
- `ArrayBuffer`

## Use this when

- you are in an edge or worker-style environment
- you need remote image processing without `sharp`
- your platform provides the APIs listed above
