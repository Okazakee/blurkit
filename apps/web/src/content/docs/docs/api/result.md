---
title: Result
description: Reference for the BlurResult returned by encode() and encodeMany().
kind: api
---

## Result shape

Use this page when integrating blurkit output into UI components, manifests, or database records.

## Encode and inspect

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg')

console.log(result.dataURL)
console.log(result.hash)
console.log(result.meta.originalWidth)
```

## Field semantics

```ts
interface BlurResult {
  dataURL: string
  hash: string
  algorithm: 'blurhash' | 'thumbhash'
  width: number
  height: number
  meta: {
    originalWidth: number
    originalHeight: number
    format?: string
    hasAlpha?: boolean
  }
}
```

- `dataURL` is the direct placeholder value for UI props. It always reflects the rendered bytes.
- `hash` is the algorithm output for storage or later decoding, with one documented exception: [Cloudflare](/docs/runtimes/cloudflare/) returns an opaque identifier instead of a portable BlurHash/ThumbHash. See [Cloudflare hash semantics](#cloudflare-hash-semantics).
- `width`/`height` describe the encoded image. For `blurhash` the rendered image uses the resized input dimensions. For `thumbhash` the renderer reconstructs pixels from the decoded hash, so the final image dimensions can differ slightly; decode `dataURL` if you need the exact rendered size.
- On Cloudflare, `width`/`height` are read from the transformed response when the bytes are a readable PNG or JPEG. If the response cannot be measured, they fall back to the requested transform box.
- `meta` is always present. `meta.format` and `meta.hasAlpha` are optional because they depend on what the decoder can report.

## Caveats

- `meta.originalWidth` and `meta.originalHeight` describe the source image as reported by the runtime. On Cloudflare they fall back to the requested transform dimensions when the image-info lookup fails, so do not treat them as guaranteed source dimensions there.
- Stored `dataURL` size depends on the chosen `outputFormat` and dimensions, not on the hash length.

## Cloudflare hash semantics

`blurkit/cloudflare` does not decode pixels to compute a BlurHash or ThumbHash. It asks `cf.image` for a transformed image and derives `hash` from a SHA-256 digest of the transformed bytes, prefixed `cfbh:` (blurhash option) or `cfth:` (thumbhash option).

- The value is stable for the same transformed bytes, but standard BlurHash/ThumbHash decoders cannot read it.
- `algorithm` echoes the requested option; it does not mean those pixels were hashed with that algorithm.
- Use `dataURL` for rendering. Treat `hash` as an opaque cache or deduplication id on Cloudflare.

## Related

- [API: encode()](/docs/api/encode/)
- [API: Manifest Helpers](/docs/api/manifest/)
- [Guide: Next.js](/docs/guides/nextjs/)
