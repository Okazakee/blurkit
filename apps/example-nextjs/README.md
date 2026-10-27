# blurkit Next.js example

Minimal Next.js app that generates a placeholder at request time with `blurkit/node` and renders it from `result.dataURL`.

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

`app/page.jsx` is an async Server Component:

1. Reads `public/hero.svg` with `node:fs/promises`, which returns a Node `Buffer`.
2. Passes the buffer straight to `encode()` from `blurkit/node` (`algorithm: 'blurhash'`, `size: 32`, `outputFormat: 'png'`). No `ArrayBuffer` conversion is needed.
3. Renders `placeholder.dataURL` as an `<img src>` next to the source image, and prints the hash and dimensions.

The page uses no dynamic APIs, so Next.js prerenders it at build time. That means `sharp` has to resolve on the machine running `next build` as well as on the dev server.

## Notes

- `blurkit/node` requires `sharp`; it is already a dependency of this example.
- Blurkit lazy-loads `sharp` behind `await import('sharp')`, so importing `blurkit/node` does not execute sharp eagerly.
- Do not add `sharp` to `serverExternalPackages` (or the equivalent Turbopack externalization) by default. Forcing it there has been observed to break libvips resolution on Vercel; letting Next.js handle sharp resolved that deployment.
- If you copy this pattern into another app, install both packages: `pnpm add blurkit sharp`.
- Full documentation: <https://blurkit.okazakee.dev/docs/>.
