---
title: Browser Runtime
description: Encode placeholders from File, Blob, ArrayBuffer, or CORS-enabled remote URLs in client code.
---

## When to use

Use `blurkit/browser` when the user provides an image in the client and you need a local preview placeholder.

## Example

```ts
import { encode } from 'blurkit/browser'

const result = await encode(file, {
  algorithm: 'thumbhash',
  outputFormat: 'png',
})
```

## Inputs / Options / Behavior

- Supported inputs:
  - `File`
  - `Blob`
  - `ArrayBuffer`
  - remote URL string or `URL` when CORS allows fetch and decode
- Decode uses browser image loading + Canvas 2D.
- Output shape is the same `BlurResult` contract used in other runtimes.

## Limits / Caveats

- Local filesystem paths are not supported.
- Remote URL flow fails when CORS blocks image decode.

## Next read

- [API: encode()](/docs/api/encode/)
- [Guide: Browser Uploader Flow](/docs/guides/browser-uploader-flow/)
- [Limits and Caveats](/docs/limits/)
