# Contributing to blurkit

Thanks for contributing. This repository is a pnpm + turbo monorepo with:

- `packages/blurkit` (library + CLI)
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
pnpm --filter @blurkit/web check
pnpm --filter @blurkit/web build
```

If your change touches example apps, also verify they build:

```bash
pnpm --filter @blurkit/example-nextjs build
pnpm --filter @blurkit/example-astro build
```

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

## PR expectations

- Include a clear problem statement and scope.
- Include reproduction steps for bug fixes.
- Add/update tests when behavior changes.
- Keep runtime caveats documented if behavior differs across `node`, `browser`, `edge`, or `cloudflare`.
- Note changelog relevance for `packages/blurkit` changes (release notes are generated from conventional commits in that path).
