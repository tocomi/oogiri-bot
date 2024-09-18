module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  rules: {
    'require-jsdoc': 'off',
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // import
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'unused-imports/no-unused-imports': 'error',
    'sort-imports': 'off',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal'],
        alphabetize: {
          order: 'asc',
        },
      },
    ],
  },
}
