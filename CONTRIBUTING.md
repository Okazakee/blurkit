# Contributing to blurkit

Thanks for contributing. This repository is a pnpm + turbo monorepo with:

- `packages/blurkit` (library + CLI)
- `packages/blurkit-wasm-codecs` (wasm codec companion package)
- `apps/web` (docs/landing website)
- `apps/example-*` (minimal integration examples)

## Local setup

```bash
pnpm install
```

## Required checks before opening a PR

Run the workspace checks:

```bash
pnpm check
```

Run package-specific confidence checks:

```bash
pnpm --filter ./packages/blurkit check
pnpm --filter ./packages/blurkit test
pnpm --filter ./packages/blurkit-wasm-codecs check
pnpm --filter ./packages/blurkit-wasm-codecs test
pnpm --filter @blurkit/web check
pnpm --filter @blurkit/web build
```

If your change touches example apps, also verify they build:

```bash
pnpm --filter @blurkit/example-nextjs build
pnpm --filter @blurkit/example-astro build
```

## Build tooling

The library packages are built with [tsdown](https://tsdown.dev) (Rolldown-based).
Each package's `build` script runs `tsdown`; see `packages/*/tsdown.config.ts`.

Blurkit deliberately emits one self-contained bundle per entry (equivalent to
tsup's `splitting: false`): browser/edge/wasm/cloudflare entry graphs must never
reference `sharp` or Node natives, and the Node entry keeps `sharp` behind a lazy
dynamic import. When changing the build, verify with:

```bash
node .github/scripts/validate-packed-package.mjs
```

which packs both packages, runs publint and `@arethetypeswrong/cli`, smokes every
entrypoint as ESM and CJS, typechecks a consumer, scans module graphs, and checks
the bundles.

## Runtime verification

CI runs real-runtime smoke tests against the packed packages, not just unit tests:

- `node-matrix`: Node 20/22/24 x sharp 0.34/0.35 real encodes
- `bun`: real encode under Bun (sharp-backed)
- `deno`: real encode under Deno (wasm codecs, no sharp)
- `browser`: real encodes in Chromium via Playwright

When behavior differs across `node`, `deno`, `browser`, `edge`, or `cloudflare`,
the runtime smoke scripts live in `.github/scripts/` (`bun-smoke.ts`,
`deno-smoke.ts`, `browser-smoke.mjs`, `sharp-matrix-consumer.mjs`) and can be run
locally against a packed install.

## Commit conventions

Use conventional commit subjects when possible:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `perf: ...`
- `chore: ...`

For website auto-deploy on `main`, commit subject must match:

```text
^(feat|fix|docs|refactor|perf)\(website\):
```

Example:

```text
feat(website): improve docs runtime comparison table
```

Full trigger and changelog rules:

- See [`COMMIT_CONVENTIONS.md`](./COMMIT_CONVENTIONS.md)

## PR expectations

- Include a clear problem statement and scope.
- Include reproduction steps for bug fixes.
- Add/update tests when behavior changes.
- Keep runtime caveats documented if behavior differs across `node`, `deno`, `browser`, `edge`, or `cloudflare`.
- Note changelog relevance for `packages/blurkit` and `packages/blurkit-wasm-codecs` changes.
- Check the `Library Size Report` workflow artifact on your PR when library packaging/output changes.
