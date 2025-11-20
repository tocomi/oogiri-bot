module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: { ecmaVersion: 8 }, // to enable features such as async/await
  ignorePatterns: ['node_modules/*', 'dist/*'], // We don't want to lint generated files nor node_modules
  extends: ['eslint:recommended'],
  overrides: [
    // This configuration will apply only to TypeScript files
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      settings: { react: { version: 'detect' } },
      env: {
        browser: true,
        node: true,
        es6: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended', // TypeScript rules
      ],
      plugins: ['import', 'unused-imports'],
      rules: {
        // I suggest this setting for requiring return types on functions only where useful
        '@typescript-eslint/explicit-function-return-type': 'off',
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
    },
  ],
}
