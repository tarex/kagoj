import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    transliterate: 'src/transliterate.ts',
    dictionary: 'src/dictionary/index.ts',
    'data/words': 'src/data/words.ts',
    'data/collocations': 'src/data/collocations.ts',
    spellcheck: 'src/spellcheck/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: true,
  target: 'es2017',
});
