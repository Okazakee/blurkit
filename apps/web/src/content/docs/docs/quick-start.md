---
title: Quick Start
description: Generate your first placeholder in Node, browser, or with the root convenience import.
---

# Quick Start

If you only need one working example before reading the full runtime docs, start here.

## Node quick start

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', {
  size: 32,
})

console.log(result.dataURL)
console.log(result.hash)
```

Use this when you are in Node, Bun, build scripts, import pipelines, or server-side code.

## Browser quick start

```ts
import { encode } from 'blurkit/browser'

const result = await encode(file, {
  algorithm: 'thumbhash',
  size: 32,
})
```

Use this when the user is selecting or previewing an image directly in the browser.

## Root import quick start

```ts
import { encode } from 'blurkit'

const result = await encode('./public/hero.jpg')
```

The root import is convenience-only. Prefer explicit runtime imports in libraries and production apps where bundling behavior matters.

## What to read next

- [Runtime Guides](/docs/runtimes/node/) for environment-specific limits
- [API: Options](/docs/api/options/) for dimension and format behavior
- [Use Cases](/docs/guides/nextjs/) for practical integrations
