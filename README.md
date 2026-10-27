# blurkit

[![npm version](https://img.shields.io/npm/v/blurkit.svg)](https://www.npmjs.com/package/blurkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Okazakee/blurkit/blob/main/LICENSE)
[![Release blurkit](https://github.com/Okazakee/blurkit/actions/workflows/release.yml/badge.svg)](https://github.com/Okazakee/blurkit/actions/workflows/release.yml)
[![Deploy website](https://github.com/Okazakee/blurkit/actions/workflows/website-deploy.yml/badge.svg)](https://github.com/Okazakee/blurkit/actions/workflows/website-deploy.yml)

Universal image placeholder generation for Node, Bun, Deno, browsers, edge runtimes, Cloudflare Workers, and WASM-first runtimes.

`blurkit` takes an image and returns a ready-to-render placeholder `dataURL` plus the hash, dimensions, and source metadata. One call hides the decode, resize, hash, and render pipeline.

**Documentation:** <https://blurkit.okazakee.dev/docs/>

## Features

- BlurHash and ThumbHash output as a `dataURL`
- Explicit entrypoints for Node, Deno, browser, edge, Cloudflare, and WASM
- Fail-fast batches with `encodeMany()`, partial success with `encodeManySettled()`
- Cache helpers, manifest helpers, and a CLI for build-time pipelines
- No platform lock-in: the same result shape on every runtime

## Install

```bash
pnpm add blurkit
```

`sharp` is an optional dependency of `blurkit` (auto-installed unless optional dependencies are skipped) and is only needed by the Node/Bun paths:

```bash
pnpm add sharp
```

Supported range: `>=0.34.5 <0.36.0`. Deno, WASM, and edge fallback paths need the wasm codecs instead:

```bash
pnpm add blurkit-wasm-codecs
```

The [runtime matrix](https://blurkit.okazakee.dev/docs/installation/#runtime-compatibility-matrix) lists every entrypoint, backend, accepted input, and extra package.

## Quick start

```ts
import { encode } from 'blurkit/node'

const result = await encode('./public/hero.jpg', { size: 32 })

console.log(result.dataURL)
console.log(result.hash)
console.log(result.meta.originalWidth, result.meta.originalHeight)
```

## Runtime entrypoints

| Runtime            | Import               | Needs                                  |
| ------------------ | -------------------- | -------------------------------------- |
| Node, Bun          | `blurkit/node`       | `sharp`                                |
| Deno               | `blurkit/deno`       | `blurkit-wasm-codecs`                  |
| Browser            | `blurkit/browser`    | —                                      |
| Edge workers       | `blurkit/edge`       | `blurkit-wasm-codecs` for the fallback |
| Cloudflare Workers | `blurkit/cloudflare` | —                                      |
| WASM runtimes      | `blurkit/wasm`       | `blurkit-wasm-codecs`                  |

The root import (`import { encode } from 'blurkit'`) resolves through package export conditions (`node`, `browser`, `worker`, `deno`). Prefer explicit entrypoints in applications and libraries.

## Examples

- [Next.js example](https://github.com/Okazakee/blurkit/tree/main/apps/example-nextjs)
- [Astro example](https://github.com/Okazakee/blurkit/tree/main/apps/example-astro)

## Docs

- [Installation and runtime matrix](https://blurkit.okazakee.dev/docs/installation/)
- [Quick start](https://blurkit.okazakee.dev/docs/quick-start/)
- [API reference](https://blurkit.okazakee.dev/docs/api/encode/)
- [CLI](https://blurkit.okazakee.dev/docs/cli/)
- [Guides](https://blurkit.okazakee.dev/docs/guides/nextjs/)
- [Limits and caveats](https://blurkit.okazakee.dev/docs/limits/)
- [Roadmap](https://blurkit.okazakee.dev/docs/roadmap/)

## CLI

```bash
# one image to stdout
npx blurkit encode ./public/hero.jpg --pretty

# a folder manifest in build pipelines
npx blurkit encode ./public \
  --glob "**/*.{jpg,jpeg,png,webp}" \
  --out blur-manifest.json \
  --pretty
```

Add `--backend wasm` to skip `sharp`; it requires `blurkit-wasm-codecs`. Full flag reference: [CLI overview](https://blurkit.okazakee.dev/docs/cli/).

## Contributing

- [CONTRIBUTING.md](./CONTRIBUTING.md) — local setup, tests, and expectations
- [COMMIT_CONVENTIONS.md](./COMMIT_CONVENTIONS.md) — commit subject rules and deploy triggers
- [PUBLISHING.md](./PUBLISHING.md) — release and website deployment workflows
- [ROADMAP.md](./ROADMAP.md) — product boundary, committed work, and exploratory ideas
