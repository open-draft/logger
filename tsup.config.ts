import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'neutral',
  format: ['esm', 'cjs'],
  outDir: './lib',
  bundle: true,
  dts: true,
})
