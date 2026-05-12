---
title: Next.js
description: Use blurkit output with Next.js Image placeholders in build-time or server-side code.
---

# Next.js image placeholders

Use `blurkit/node` when you are processing images during a build, in route handlers, or in server-side code before rendering a Next.js page.

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

## Why this shape works

Next.js already accepts a `blurDataURL`, so `blurkit` can do the image work ahead of rendering and hand the result directly to `<Image />`.

:::note
If the image is purely decorative, an empty `alt=""` is still valid. The example uses meaningful alt text because most product and editorial images are content, not decoration.
:::

## Caveat

Use the browser runtime only when the user is selecting or transforming images directly in the client. For app or build infrastructure, stay with `blurkit/node`.
