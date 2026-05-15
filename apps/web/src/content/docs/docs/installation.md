---
title: Installation
description: Install blurkit and understand when sharp is needed.
---

## When to use

Use this page before running `blurkit/node`, CLI commands, or worker/browser runtime code.

## Example

```bash
pnpm add blurkit
```

## Inputs / Options / Behavior

- `blurkit` installs `sharp` as an optional dependency.
- Node/Bun runtime and CLI require `sharp` at execution time.
- Browser, edge, cloudflare, and wasm entrypoints do not need `sharp`.

| Package manager | Default install | If optional deps are skipped |
| --- | --- | --- |
| `pnpm` | `pnpm add blurkit` | `pnpm add sharp` |
| `npm` | `npm install blurkit` | `npm install sharp` |
| `yarn` | `yarn add blurkit` | `yarn add sharp` |
| `bun` | `bun add blurkit` | `bun add sharp` |

## Limits / Caveats

- If `sharp` is missing, `blurkit/node` throws `BLURKIT_MISSING_SHARP` on first encode call.
- Root import in Node/Bun resolves to Node runtime behavior and therefore also needs `sharp`.

## Next read

- [Quick Start](/docs/quick-start/)
- [Node Runtime](/docs/runtimes/node/)
- [CLI Overview](/docs/cli/)
