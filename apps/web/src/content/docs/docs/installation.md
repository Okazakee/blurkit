---
title: Installation
description: Install blurkit with pnpm, npm, yarn, or bun, and add sharp when you need the Node runtime or CLI.
---

# Installation

Use the same package across runtimes, then add `sharp` when you plan to use the Node entrypoint or the CLI in a Node or Bun environment.

## Install matrix

| Package manager | Core package | Node or Bun with `sharp` |
| --- | --- | --- |
| `pnpm` | `pnpm add blurkit` | `pnpm add blurkit sharp` |
| `npm` | `npm install blurkit` | `npm install blurkit sharp` |
| `yarn` | `yarn add blurkit` | `yarn add blurkit sharp` |
| `bun` | `bun add blurkit` | `bun add blurkit sharp` |

## When `sharp` is required

Install `sharp` when you are using:

- `blurkit/node`
- the CLI
- Node or Bun build-time image pipelines

You do **not** need `sharp` for:

- `blurkit/browser`
- `blurkit/edge`
- the root package when it resolves to browser or edge code

## What to read next

- [Quick Start](/docs/quick-start/) for your first placeholder
- [Node Runtime](/docs/runtimes/node/) for server and build-time usage
- [CLI Overview](/docs/cli/) for shell workflows
