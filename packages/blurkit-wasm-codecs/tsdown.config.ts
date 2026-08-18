import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
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
})
