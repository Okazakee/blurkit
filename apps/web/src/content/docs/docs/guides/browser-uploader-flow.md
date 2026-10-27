---
title: Browser Uploader Flow
description: Generate placeholders in the browser when users upload images in client UI.
---

## When to use

Use this pattern when images are selected by users and should not be uploaded just to generate a placeholder.

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
    width: result.meta.originalWidth,
    height: result.meta.originalHeight,
  }
}
```

## Inputs / Options / Behavior

- Use `File` or `Blob` input for local user images.
- `meta` fields can be stored with upload payloads.
- `thumbhash` produces a shorter hash string than `blurhash`. That does not automatically shrink `dataURL`: the rendered bytes depend on the image dimensions and `outputFormat`, so compare the stored `dataURL` size if payload budget is the concern.

## Limits / Caveats

- Remote URL input requires CORS.
- Browser runtime cannot read local path strings.

## Next read

- [Browser Runtime](/docs/runtimes/browser/)
- [API: Options](/docs/api/options/)
- [Limits and Caveats](/docs/limits/)
