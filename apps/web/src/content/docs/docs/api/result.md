---
title: Result
description: Reference for the BlurResult returned by encode() and encodeMany().
---

## When to use

Use this page when integrating blurkit output into UI components, manifests, or database records.

## Example

```ts
const result = await encode('./public/hero.jpg')

console.log(result.dataURL)
console.log(result.hash)
console.log(result.meta?.originalWidth)
```

## Inputs / Options / Behavior

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

- `dataURL` is the direct placeholder value for UI props.
- `hash` preserves algorithm output for storage or post-processing.
- `width`/`height` reflect placeholder dimensions.
- `meta` describes source image properties when available.

## Limits / Caveats

- `meta` is optional.
- Stored `dataURL` size depends on chosen `outputFormat` and dimensions.

## Next read

- [API: encode()](/docs/api/encode/)
- [API: Manifest Helpers](/docs/api/manifest/)
- [Guide: Next.js](/docs/guides/nextjs/)
