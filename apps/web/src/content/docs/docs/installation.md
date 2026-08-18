---
title: Installation
description: Install blurkit and understand when sharp or wasm codecs are needed.
---

## When to use

Use this page before running `blurkit/node`, `blurkit/deno`, CLI commands, or worker/browser runtime code.

## Example

```bash
pnpm add blurkit
```

## Inputs / Options / Behavior

### Sharp: Node-only

`blurkit/browser`, `blurkit/edge`, `blurkit/wasm`, and `blurkit/cloudflare` do **not** require Sharp.

`blurkit/node` and the default root import in Node/Bun require Sharp at execution time:

- `sharp` is declared as an optional dependency (auto-installed unless optional dependencies are skipped) and as an optional peer dependency.
- Supported Sharp range: `>=0.34.5 <0.36.0` (tested against 0.34.x and 0.35.x).
- If your install skipped optional dependencies (`npm install --omit=optional`), install Sharp manually.

| Package manager | Default install | If optional deps are skipped |
| --- | --- | --- |
| `pnpm` | `pnpm add blurkit` | `pnpm add sharp` |
| `npm` | `npm install blurkit` | `npm install sharp` |
| `yarn` | `yarn add blurkit` | `yarn add sharp` |
| `bun` | `bun add blurkit` | `bun add sharp` |

### WASM codecs: wasm-backed runtimes

`blurkit-wasm-codecs` is required at execution time for `blurkit/deno`, `blurkit/wasm`, `blurkit/edge` fallback in runtimes without native decode APIs, and CLI `--backend wasm`.

```bash
pnpm add blurkit-wasm-codecs
```

### Explicit entrypoints

Prefer explicit runtime entrypoints in production and framework code (`blurkit/node`, `blurkit/browser`, ...) over the root import so the runtime you get is the runtime you expect.

## Verified runtime matrix

The packed package is exercised in CI with real encodes (not only unit tests):

| Runtime | Entrypoint | Backend | Verified on |
| --- | --- | --- | --- |
| Node | `blurkit/node` | sharp | Node 20/22/24 x sharp 0.34.x/0.35.x |
| Bun | `blurkit/node` | sharp | Bun latest (1.x) |
| Deno | `blurkit/deno` | wasm codecs | Deno latest (2.x), no sharp |
| Browser | `blurkit/browser` | browser APIs | Chromium (Playwright) |
| Edge/Cloudflare | `blurkit/edge` / `blurkit/cloudflare` | native or wasm / `cf.image` | unit tests only (real worker execution deferred; `cf.image` runs only on Cloudflare) |

## Limits / Caveats

- If `sharp` is missing, `blurkit/node` throws `BLURKIT_MISSING_SHARP` on first encode call.
- If wasm codecs are missing, wasm paths throw `BLURKIT_MISSING_WASM_CODECS` with install guidance.
- Root import in Node/Bun resolves to Node runtime behavior and therefore also needs `sharp`.

## Next read

- [Quick Start](/docs/quick-start/)
- [Node Runtime](/docs/runtimes/node/)
- [CLI Overview](/docs/cli/)
