# blurkit Next.js example

Minimal Next.js app that generates a placeholder at build time with `blurkit/node` and renders it from `result.dataURL`.

## Run

From the repository root:

```bash
pnpm install
pnpm --filter @blurkit/example-nextjs dev
```

The app starts on <http://localhost:3000>.

## Build

```bash
pnpm --filter @blurkit/example-nextjs build
pnpm --filter @blurkit/example-nextjs start
```

## How it works

`app/page.jsx` is a synchronous Server Component whose encoding happens at module scope:

1. The module reads `public/hero.svg` with `node:fs/promises` and awaits the result before the component is defined. That `Buffer` goes straight into `encode()` from `blurkit/node` (`algorithm: 'blurhash'`, `size: 32`, `outputFormat: 'png'`); no `ArrayBuffer` conversion is needed.
2. The component then renders `placeholder.dataURL` as an `<img src>` next to the source image, and prints the hash and dimensions.

Because the page uses no dynamic APIs, Next.js prerenders it at build time: the module-level `await` runs during `next build`, not per request. `sharp` therefore has to resolve on the build machine as well as on the dev server. Adding a dynamic API or a per-request encode would move the work to request time.

## Notes

- `blurkit/node` requires `sharp`; it is already a dependency of this example.
- Blurkit lazy-loads `sharp` behind `await import('sharp')`, so importing `blurkit/node` does not execute sharp eagerly.
- Do not add `sharp` to `serverExternalPackages` (or the equivalent Turbopack externalization) by default. Forcing it there has been observed to break libvips resolution on Vercel; letting Next.js handle sharp resolved that deployment.
- If you copy this pattern into another app, install both packages: `pnpm add blurkit sharp`.
- Full documentation: <https://blurkit.okazakee.dev/docs/>.
