# Commit Message Conventions

This repository uses commit subjects to control automation behavior.

Use this guide to avoid triggering the wrong workflow.

## Subject format

Use conventional commit style for the **first line** of the commit message:

```text
<type>(<scope>): <description>
```

Examples:

```text
feat(website): add wasm runtime docs page
fix(node): handle sharp missing error path
refactor(edge): route to wasm fallback when native decode APIs are missing
docs(readme): clarify release trigger behavior
```

## Allowed `type` values

Preferred commit types:

- `feat`
- `fix`
- `perf`
- `refactor`
- `docs`
- `chore`
- `test`
- `ci`
- `build`

## Workflow trigger rules

### Website deploy workflow

Workflow: `.github/workflows/website-deploy.yml`

Automatic deploy on push to `main` requires both:

- File changes under `apps/web/**`
- Commit subject matching:

```text
^(feat|fix|docs|refactor|perf)\(website\):
```

Valid examples:

```text
feat(website): add wasm runtime guide
fix(website): correct docs sidebar order
docs(website): update quick start runtime matrix
```

Will **not** auto-deploy website:

```text
chore(website): bump deps
feat: update docs layout
docs(web): typo fixes
```

Manual `workflow_dispatch` can still deploy website without subject match.

### Library release workflow

Workflow: `.github/workflows/release.yml`

Release workflow is **tag-driven only**. Commits do not trigger publish by themselves.

Valid release tags:

- `vX.Y.Z`
- `X.Y.Z`

Only stable semver is allowed. Pre-release tags are rejected.

Tag must match `packages/blurkit/package.json` version.

## Changelog generation rules

GitHub release notes are generated from commits in `packages/blurkit` path.

Included commit types:

- `feat`
- `fix`
- `perf`
- `refactor`
- `BREAKING CHANGE` (or `!` in subject)

Ignored for release-note sections:

- `docs`
- `chore`
- `test`
- `ci`
- `build`

Commits with scope `website`, `web`, or `docs` are excluded from library release-note sections unless marked breaking.

## Safe defaults

Use these defaults unless you have a specific reason not to:

- Library code change:
  - `feat(node): ...`
  - `fix(edge): ...`
  - `refactor(wasm): ...`
- Website/docs-only deploy intent:
  - `feat(website): ...`
  - `docs(website): ...`
- Non-deploy housekeeping:
  - `chore: ...`

