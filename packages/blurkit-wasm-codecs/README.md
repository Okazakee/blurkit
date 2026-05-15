# blurkit-wasm-codecs

WASM codec companion package for [`blurkit`](https://www.npmjs.com/package/blurkit).

This package provides the jsquash decode/resize/encode backend used by:

- `blurkit/wasm`
- `blurkit/edge` fallback when native `ImageDecoder` and `OffscreenCanvas` are unavailable
- `blurkit` CLI with `--backend wasm`

## Install

```bash
npm install blurkit-wasm-codecs
```

## Usage

You normally do not import this package directly.
Install it alongside `blurkit` when you need wasm runtime paths.
