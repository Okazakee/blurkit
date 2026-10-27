---
title: Installation
description: Install blurkit, pick an entrypoint, and check which runtime needs sharp or wasm codecs.
---

## Install the package

```bash
pnpm add blurkit
```

Nothing else is required for `blurkit/browser`. The Node/Bun and wasm-backed entrypoints need one extra package each; the table below is the canonical compatibility matrix for the whole project.

## Runtime compatibility matrix

| Runtime    | Entrypoint           | Decode            | Accepts                     | Extra package         |
| ---------- | -------------------- | ----------------- | --------------------------- | --------------------- |
| Node, Bun  | `blurkit/node`       | `sharp`           | path, URL, Blob, bytes      | `sharp`               |
| Deno       | `blurkit/deno`       | wasm codecs       | path, URL, Blob, bytes      | `blurkit-wasm-codecs` |
| Browser    | `blurkit/browser`    | browser APIs      | File, Blob, bytes, CORS URL | none                  |
| Edge       | `blurkit/edge`       | native, else wasm | URL, Blob, bytes            | codecs (fallback)     |
| Cloudflare | `blurkit/cloudflare` | `cf.image`        | URL only                    | none                  |
| WASM       | `blurkit/wasm`       | wasm codecs       | URL, Blob, bytes            | `blurkit-wasm-codecs` |

`bytes` means `ArrayBuffer` or `Uint8Array`; Node `Buffer` is a `Uint8Array` and works directly. "CORS URL" means a remote URL the browser is allowed to fetch.

CI runs real encodes for Node (20/22/24 with sharp 0.34.x and 0.35.x), Bun, Deno, and Chromium. Edge and Cloudflare are covered by unit tests only: real worker execution is deferred, and `cf.image` runs only on Cloudflare.

## Sharp (Node and Bun only)

`blurkit/browser`, `blurkit/deno`, `blurkit/edge`, `blurkit/cloudflare`, and `blurkit/wasm` do **not** use Sharp.

`blurkit/node` and the root import in Node/Bun need it at execution time:

- `sharp` is an optional dependency (auto-installed unless optional dependencies are skipped) and an optional peer dependency.
- Supported range: `>=0.34.5 <0.36.0` (tested against 0.34.x and 0.35.x).
- If your install skipped optional dependencies (`npm install --omit=optional`), add it manually.

| Package manager | Default install       | If optional deps are skipped |
| --------------- | --------------------- | ---------------------------- |
| `pnpm`          | `pnpm add blurkit`    | `pnpm add sharp`             |
| `npm`           | `npm install blurkit` | `npm install sharp`          |
| `yarn`          | `yarn add blurkit`    | `yarn add sharp`             |
| `bun`           | `bun add blurkit`     | `bun add sharp`              |

## WASM codecs (Deno, WASM, edge fallback)

```bash
pnpm add blurkit-wasm-codecs
```

Install it for `blurkit/deno`, `blurkit/wasm`, edge runtimes without native decode APIs, and CLI `--backend wasm`.

## Missing dependency errors

- Missing `sharp` makes `blurkit/node` throw `BLURKIT_MISSING_SHARP` on the first encode.
- Missing codecs make wasm paths throw `BLURKIT_MISSING_WASM_CODECS` with install guidance.
- The root import in Node/Bun resolves to the Node runtime, so it needs `sharp` too.

## Next steps

- [Quick Start](/docs/quick-start/)
- [Node Runtime](/docs/runtimes/node/)
- [Limits and Caveats](/docs/limits/)
