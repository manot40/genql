import { defineConfig } from 'tsdown';

export default defineConfig({
  hash: false,
  copy: ['./src/runtime'],
  entry: ['./src/index.ts', './src/cli.ts'],
  outDir: './dist',
  exports: true,
  nodeProtocol: true,
});
