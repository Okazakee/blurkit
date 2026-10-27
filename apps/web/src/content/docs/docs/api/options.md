---
title: Options
description: Reference for BlurKitOptions used by encode() and encodeMany().
---

## Option object

Use this page when you need predictable placeholder dimensions, algorithm selection, or output format control.

## Encode with explicit dimensions

```ts
import { encode } from 'blurkit/node'

await encode('./public/hero.jpg', {
  algorithm: 'thumbhash',
  width: 40,
  height: 24,
  outputFormat: 'jpeg',
})
```

## Defaults

```ts
interface BlurKitOptions {
  algorithm?: 'blurhash' | 'thumbhash'
  size?: number
  width?: number
  height?: number
  componentX?: number
  componentY?: number
  outputFormat?: 'png' | 'jpeg'
  cache?: BlurKitCache
}
```

Defaults:

- `algorithm`: `blurhash`
- `size`: `32`
- `componentX`: `4`
- `componentY`: `3`
- `outputFormat`: `png`

Dimension behavior:

- `size` scales longest side while preserving aspect ratio.
- `width` only derives `height` from source ratio.
- `height` only derives `width` from source ratio.
- `width` + `height` uses exact dimensions.

## Algorithm-specific options

- `componentX` and `componentY` only affect `blurhash`.
- Cache helpers are runtime-specific: see [API: Cache](/docs/api/cache/) for the full matrix.

## Related

- [API: encode()](/docs/api/encode/)
- [API: Cache](/docs/api/cache/)
- [API: Result](/docs/api/result/)
