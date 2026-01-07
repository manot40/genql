import { defineConfig } from 'tsdown';

export default defineConfig({
  copy: ['./src/runtime'],
  entry: ['./src/index.ts', './src/cli.ts'],
  outDir: './dist',
  exports: true,
});
