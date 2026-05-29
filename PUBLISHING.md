# Publishing

Library releases and website deployments are handled by separate workflows.

## Library Release (`.github/workflows/release.yml`)

1. Bump `packages/blurkit/package.json` and `packages/blurkit-wasm-codecs/package.json` to the version you want to publish.
2. Push a matching stable tag like `v0.1.5` or `0.1.5`.
3. The workflow validates tag/version match for both packages, publishes `blurkit-wasm-codecs` then `blurkit`, generates lib-scoped release notes, and creates/updates the GitHub Release.

Repository setup:

- Configure both `blurkit` and `blurkit-wasm-codecs` for npm trusted publishing against `Okazakee/blurkit` and the `release.yml` workflow.
- You can do that in the npm UI or with:
  - `npm trust github blurkit --repo Okazakee/blurkit --file release.yml`
  - `npm trust github blurkit-wasm-codecs --repo Okazakee/blurkit --file release.yml`
- Trusted publishing requires a current npm CLI with `npm trust` support and account-level 2FA enabled when you create the trust relationship.
- The workflow accepts only stable semver tags (`vX.Y.Z` or `X.Y.Z`) and fails if the tag does not match both `packages/blurkit/package.json` and `packages/blurkit-wasm-codecs/package.json`.
- If an exact version is already on npm for a package, publish for that package is skipped.
- GitHub Release notes are generated from commits scoped to `packages/blurkit` and `packages/blurkit-wasm-codecs` and include only product-impacting conventional commit types (`feat`, `fix`, `perf`, `refactor`, plus breaking changes).
- No long-lived `NPM_TOKEN` secret is required for publishing.

## Library Size Report (`.github/workflows/library-size-report.yml`)

- Runs on pull requests and release tag pushes.
- Produces `artifacts/library-size-report.json` and `artifacts/library-size-report.md` as downloadable workflow artifacts.
- Use these artifacts to review package size deltas before merging and at release time.

## Website Deploy (`.github/workflows/website-deploy.yml`)

- Automatic deploy trigger: push to `main` with website path changes (`apps/web/**`) and a commit subject matching `^(feat|fix|docs|refactor|perf)\(website\):`.
- Non-matching commit subjects intentionally skip deployment, even when website files changed.
- Manual `workflow_dispatch` is available and bypasses the commit-subject gate for testing or recovery deploys.
