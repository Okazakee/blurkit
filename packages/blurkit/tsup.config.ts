import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'root-node': 'src/root-node.ts',
    'root-browser': 'src/root-browser.ts',
    'root-deno': 'src/root-deno.ts',
    'root-edge': 'src/root-edge.ts',
    node: 'src/node.ts',
    browser: 'src/browser.ts',
    deno: 'src/deno.ts',
    edge: 'src/edge.ts',
    cloudflare: 'src/cloudflare.ts',
    wasm: 'src/wasm.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: false,
})
