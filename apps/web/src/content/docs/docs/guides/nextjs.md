---
title: Next.js
description: Use blurkit output as blurDataURL in Next.js Image workflows.
---

## When to use

Use this pattern when image URLs are known in build-time or server-side code.

## Example

```tsx title="app/components/HeroImage.tsx"
import Image from 'next/image'
import { encode } from 'blurkit/node'

export default async function HeroImage() {
  const result = await encode('./public/hero.jpg', { size: 32 })

  return (
    <Image
      src="/hero.jpg"
      alt="Product hero image"
      width={1200}
      height={800}
      placeholder="blur"
      blurDataURL={result.dataURL}
    />
  )
}
```

## Inputs / Options / Behavior

- The component is an async Server Component: the encode runs before the markup is rendered.
- `blurDataURL` receives `result.dataURL` directly.
- Pass `width` and `height` (or use `fill`) because `next/image` still needs the rendered layout dimensions. `result.width`/`result.height` are the encoder's target dimensions, not necessarily the display size.
- Use `blurkit/node` for this flow; it supports `Buffer` and `Uint8Array` inputs, so `readFile()` output can be passed to `encode()` without conversion.

## Limits / Caveats

- Requires `sharp` in the Node environment running the build or server.
- Do not use the browser runtime for server-only placeholder generation.

## Known integration caveat: Turbopack and native Sharp resolution

Blurkit's Node runtime needs Sharp, and Blurkit itself lazy-loads it behind `await import('sharp')` — importing `blurkit/node` never executes Sharp eagerly.

A production Next.js 16 + Turbopack + Vercel deployment was observed to break Sharp/libvips native resolution when Sharp was explicitly forced into `serverExternalPackages`. Allowing Next/Turbopack to handle Sharp normally (the default) resolved that deployment.

Therefore:

- Do **not** add Sharp to `serverExternalPackages` by default.
- If you customize native package externalization, test your target deployment runtime before shipping.

This is a known integration caveat for Blurkit + Next.js + Turbopack, not a universal Next.js rule.

## Next read

- [Node Runtime](/docs/runtimes/node/)
- [API: Result](/docs/api/result/)
- [Guide: Build-time Manifest Generation](/docs/guides/build-time-manifest-generation/)
