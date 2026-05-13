# blurkit Next.js example

Minimal Next.js example that generates a placeholder from a local image file using .

## Run

Scope: all 4 workspace projects
Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 634, reused 539, downloaded 4, added 0
Packages: +8
++++++++
Progress: resolved 671, reused 550, downloaded 7, added 8, done

Done in 2.5s using pnpm v11.1.1
▲ Next.js 16.2.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.1.50:3000
✓ Ready in 295ms
Creating turbopack project {
  dir: '/home/okazakee/Desktop/Projects/blurkit/apps/example-nextjs',
  testMode: true
}

▲ Next.js 16.2.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.1.50:3000
✓ Ready in 134ms
Creating turbopack project {
  dir: '/home/okazakee/Desktop/Projects/blurkit/apps/example-nextjs',
  testMode: true
}

[?25h
/home/okazakee/Desktop/Projects/blurkit/apps/example-nextjs:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @blurkit/example-nextjs@ dev: `next dev`
Exit status 143

## Build

▲ Next.js 16.2.6 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 1135ms
  Running TypeScript ...
  Finished TypeScript in 35ms ...
  Collecting page data using 4 workers ...
  Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 265ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content

## Notes

- Uses a server component () so Node APIs and  are available.
- Input image is  for deterministic local runs.
