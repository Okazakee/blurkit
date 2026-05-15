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

- `blurkit` installs `sharp` as an optional dependency.
- Node/Bun runtime and CLI require `sharp` at execution time.
- Deno runtime requires `blurkit-wasm-codecs` at execution time.
- `blurkit-wasm-codecs` is also required for `blurkit/wasm` and for `blurkit/edge` fallback in runtimes without native decode APIs.

| Package manager | Default install | If optional deps are skipped |
| --- | --- | --- |
| `pnpm` | `pnpm add blurkit` | `pnpm add sharp` |
| `npm` | `npm install blurkit` | `npm install sharp` |
| `yarn` | `yarn add blurkit` | `yarn add sharp` |
| `bun` | `bun add blurkit` | `bun add sharp` |

Deno runtime also needs `blurkit-wasm-codecs` alongside `blurkit`:

```bash
npm install blurkit blurkit-wasm-codecs
```

Wasm companion install (only when needed):

```bash
pnpm add blurkit-wasm-codecs
```

## Limits / Caveats

- If `sharp` is missing, `blurkit/node` throws `BLURKIT_MISSING_SHARP` on first encode call.
- If wasm codecs are missing, wasm paths throw `BLURKIT_MISSING_WASM_CODECS` with install guidance.
- Root import in Node/Bun resolves to Node runtime behavior and therefore also needs `sharp`.

## Next read

- [Quick Start](/docs/quick-start/)
- [Node Runtime](/docs/runtimes/node/)
- [CLI Overview](/docs/cli/)
