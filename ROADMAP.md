# Roadmap (internal)

This file and [`docs/roadmap.md`](apps/web/src/content/docs/docs/roadmap.md) describe the same direction. Keep them in sync when scope changes.

## Product boundary

`input -> placeholder result` only. Most runtimes decode an image, hash it, and render the placeholder; Cloudflare is the documented exception, where `cf.image` produces the bytes and the hash is an opaque digest. Anything beyond that boundary needs an explicit decision.

## Working rules

1. Prioritize runtime reliability and performance over new features.
2. Treat framework adapters as thin wrappers, not full integrations.
3. Add manifest targets only when repeated user demand is proven.
4. Enforce "one in, one out" for new APIs: avoid parallel ways to do the same thing.
5. Keep "Not planned" explicit to prevent drift.

## Committed

No new feature work is committed beyond keeping the supported runtimes green and the documentation accurate. Committed changes are driven by:

- runtime and dependency maintenance (Node/Bun/Deno/sharp releases, wasm codecs)
- CI coverage for the runtimes already documented
- documentation accuracy for the existing API surface

## Exploring (not committed)

Ideas with user signal but no committed delivery:

- **Vercel Edge adapter** (`blurkit/vercel-edge`) — wrap the edge path with Vercel-specific caveats and config.
- **Netlify Edge adapter** (`blurkit/netlify-edge`) — explicit runtime contract and fewer surprises.
- **Fastly Compute adapter** — strong signal for serious edge support.
- **React Native / Expo runtime** — generate placeholders client-side from picked images.
- **Electron runtime** — local file paths for desktop CMS and media tooling.

Listing an item here does not mean it ships. Each needs an issue, a runtime contract, and CI coverage before it becomes committed.

## Not planned

- Server-side rendering integrations (Next.js Image, SvelteKit image, etc.)
- CDN-specific image transformation pipelines
- Full image processing (resize, crop, format conversion beyond placeholder output)
- Framework-specific component wrappers (React, Vue, Svelte placeholder components)
- Placeholder animation or progressive enhancement logic
- Preset collections or curated hash libraries
