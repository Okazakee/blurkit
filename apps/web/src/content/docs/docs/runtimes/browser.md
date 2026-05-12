---
title: Browser Runtime
description: Use the browser runtime for client-side uploads, private local previews, and CORS-permitted remote images.
---

# Browser Runtime

`blurkit/browser` is for client-side image processing. It is the runtime used by the live demo on the website.

## Example

```ts
import { encode } from 'blurkit/browser'

const result = await encode(file, {
  algorithm: 'thumbhash',
  outputFormat: 'png',
})
```

## Supported inputs

- `File`
- `Blob`
- `ArrayBuffer`
- Remote URLs when the target server permits CORS

## What it does not support

- local filesystem path strings such as `./public/hero.jpg`
- filesystem access of any kind

## Decode path

The current browser implementation uses browser-native image loading plus a Canvas 2D pipeline to extract pixels and render the final placeholder image.

## Caveat

Remote URLs depend on CORS. `File` and `Blob` input are the safest path for private images and interactive browser demos.
