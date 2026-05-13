# blurkit Astro example

Minimal Astro example that generates a placeholder from a local image file using `blurkit/node`.

## Run

```bash
pnpm --filter @blurkit/example-astro dev
```

## Build

```bash
pnpm --filter @blurkit/example-astro build
```

## Notes

- Placeholder is generated in `src/pages/index.astro` during server rendering.
- Includes `sharp` because `blurkit/node` requires it at runtime.
- Input image is `public/hero.svg` for deterministic local runs.
