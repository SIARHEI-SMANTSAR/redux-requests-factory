const common = {
  entry: ['src/index.ts'],
  sourcemap: true,
  target: 'es5',
  splitting: false,
};

module.exports = [
  {
    ...common,
    format: ['cjs'],
    dts: false,
    clean: true,
    outExtension: () => ({ js: '.js' }),
  },
  {
    ...common,
    format: ['esm'],
    dts: false,
    clean: false,
    outExtension: () => ({ js: '.esm.js' }),
  },
];
