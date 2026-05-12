---
title: Options
description: Reference for the shared BlurKitOptions object used by encode() and encodeMany().
---

# API: Options

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

## Defaults

- `algorithm`: `blurhash`
- `size`: `32`
- `componentX`: `4`
- `componentY`: `3`
- `outputFormat`: `png`

## Notes

- `size` scales the longest side while preserving aspect ratio.
- `width` and `height` can be used as explicit overrides.
- `componentX` and `componentY` only affect `blurhash`.
- `cache` is accepted everywhere, but the package only ships a memory cache helper through `blurkit/node`.

## Option interactions

- If you provide `size`, the runtime preserves aspect ratio.
- If you provide only `width`, height is derived from the source aspect ratio.
- If you provide only `height`, width is derived from the source aspect ratio.
- If you provide both `width` and `height`, those exact placeholder dimensions are used.
