import { defineConfig } from 'tsdown'

/**
 * Blurkit's package contract requires every entry to be a self-contained
 * bundle (the tsup `splitting: false` shape): the browser/edge/wasm/cloudflare
 * entry graphs must never reference sharp or Node natives, and each entry
 * must be importable without pulling sibling runtime code into the module
 * graph.
 *
 * tsdown bundles per entry, but its multi-entry default code-splits shared
 * modules into hashed chunks. To preserve the self-contained contract we
 * emit one tsdown config per entry (a single-entry build cannot produce
 * shared chunks) and pin the output extensions to the historical
 * `.js`/`.cjs`/`.d.ts`/`.d.cts` layout that the package `files` glob and
 * `exports` map reference.
 */

const entries = {
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
}

export default defineConfig(
  Object.entries(entries).map(([name, path]) => ({
    entry: { [name]: path },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    outExtensions({ format }) {
      const isEsm = format === 'es' || format === 'esm'
      return isEsm
        ? { js: '.js', dts: '.d.ts' }
        : { js: '.cjs', dts: '.d.cts' }
    },
  })),
)
