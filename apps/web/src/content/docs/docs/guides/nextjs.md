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

const result = await encode('./public/hero.jpg')

<Image
  src="/hero.jpg"
  placeholder="blur"
  blurDataURL={result.dataURL}
  alt="Product hero image"
/>
```

## Inputs / Options / Behavior

- Placeholder work runs before render.
- `blurDataURL` receives `result.dataURL` directly.
- Runtime entrypoint should be `blurkit/node` for this flow.

## Limits / Caveats

- Requires `sharp` in Node environment.
- Do not use browser runtime for server-only placeholder generation.

## Next read

- [Node Runtime](/docs/runtimes/node/)
- [API: Result](/docs/api/result/)
- [Guide: Build-time Manifest Generation](/docs/guides/build-time-manifest-generation/)
