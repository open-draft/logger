import { defineConfig } from 'tsup'

const nodeConfig = defineConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  format: ['esm', 'cjs'],
  outDir: './lib/node',
  bundle: true,
  dts: true,
})

const browserConfig = defineConfig({
  entry: ['src/index.ts'],
  platform: 'browser',
  format: ['esm', 'cjs'],
  outDir: './lib/browser',
  bundle: true,
  dts: true,
})

export default [nodeConfig, browserConfig]
