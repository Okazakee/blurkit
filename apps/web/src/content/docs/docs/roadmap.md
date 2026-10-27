---
title: Roadmap
description: Committed work, exploratory ideas, and features blurkit deliberately does not plan to ship.
pagefind: false
---

## How to read this page

blurkit stays small on purpose: an image goes in, a placeholder result comes out. Everything below is either committed, exploratory, or explicitly out of scope. Only the **Committed** section is a promise.

Have a use case that changes the picture? Open an issue with the runtime and the input shape you need.

## Committed

No new features are committed right now. Active work is limited to:

- runtime and dependency maintenance (Node, Bun, Deno, sharp, wasm codecs)
- CI coverage for the runtimes that are already documented
- keeping the [runtime matrix](/docs/installation/#runtime-compatibility-matrix) and API reference accurate

## Exploring (not committed)

These have user signal but no delivery commitment. Each needs a runtime contract, tests, and CI coverage first.

- **Vercel Edge adapter** (`blurkit/vercel-edge`) — edge path with Vercel-specific caveats and config.
- **Netlify Edge adapter** (`blurkit/netlify-edge`) — explicit runtime contract and fewer surprises.
- **Fastly Compute adapter** — for teams running workers on Fastly.
- **React Native / Expo runtime** — client-side placeholders from picked images.
- **Electron runtime** — local file paths for desktop CMS and media tooling.

## Not planned

- Server-side rendering integrations (Next.js Image, SvelteKit image, and similar).
- CDN-specific image transformation pipelines.
- Full image processing beyond placeholder output.
- Framework-specific component wrappers (React, Vue, Svelte).
- Placeholder animation or progressive enhancement.
- Preset collections or curated hash libraries.

The same boundaries are described from the runtime side in [Limits and Caveats](/docs/limits/#not-shipped-by-design).
