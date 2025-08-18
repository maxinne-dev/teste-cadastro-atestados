module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: null },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'node_modules'],
};