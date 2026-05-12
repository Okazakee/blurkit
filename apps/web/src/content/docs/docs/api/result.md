---
title: Result
description: Reference for the BlurResult returned by encode() and encodeMany().
---

# API: Result

```ts
interface BlurResult {
  dataURL: string
  hash: string
  algorithm: 'blurhash' | 'thumbhash'
  width: number
  height: number
  meta?: {
    originalWidth: number
    originalHeight: number
    format?: string
    hasAlpha?: boolean
  }
}
```

`dataURL` is the main product value for UI integration, while `hash` preserves the underlying algorithm-specific placeholder string.

## What each field is for

- `dataURL`: pass directly into UI placeholder props or persist in JSON
- `hash`: store the algorithm output separately when you want to keep the raw placeholder value
- `algorithm`: lets downstream code know how the hash was produced
- `width` and `height`: describe the placeholder dimensions used during encoding
- `meta`: gives source image information that is often needed in content pipelines
