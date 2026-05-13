---
title: Installation
description: Install blurkit for your runtime and add sharp when using Node runtime or CLI.
---

## When to use

Use this page before running `blurkit/node` code or any CLI command.

## Example

```bash
pnpm add blurkit sharp
```

## Inputs / Options / Behavior

- Install only `blurkit` when you use browser or edge entrypoints.
- Install `blurkit` and `sharp` when you use Node runtime or CLI.

| Package manager | Browser/edge install | Node/CLI install |
| --- | --- | --- |
| `pnpm` | `pnpm add blurkit` | `pnpm add blurkit sharp` |
| `npm` | `npm install blurkit` | `npm install blurkit sharp` |
| `yarn` | `yarn add blurkit` | `yarn add blurkit sharp` |
| `bun` | `bun add blurkit` | `bun add blurkit sharp` |

## Limits / Caveats

- Node runtime fails without `sharp`.
- Root import can resolve to Node runtime in Node/Bun and therefore also needs `sharp` in those environments.

## Next read

- [Quick Start](/docs/quick-start/)
- [Node Runtime](/docs/runtimes/node/)
- [CLI Overview](/docs/cli/)
