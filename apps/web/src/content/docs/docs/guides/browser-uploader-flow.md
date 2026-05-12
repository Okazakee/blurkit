---
title: Browser Uploader Flow
description: Generate local placeholders in the browser when users upload images directly in the client.
---

# Browser uploader flow

Use `blurkit/browser` when a user selects an image in the browser and you want to create a lightweight preview or upload-side metadata without sending the image elsewhere first.

## Example

```ts
import { encode } from 'blurkit/browser'

async function handleFile(file: File) {
  const result = await encode(file, {
    algorithm: 'thumbhash',
    size: 32,
  })

  return {
    blurDataURL: result.dataURL,
    blurHash: result.hash,
    width: result.meta?.originalWidth,
    height: result.meta?.originalHeight,
  }
}
```

## Why this shape works

The browser runtime lets you create placeholders from local user files while keeping the processing inside the browser tab.

## Caveat

Remote browser URLs still depend on CORS. For private or user-selected images, `File` input is the most reliable path.
