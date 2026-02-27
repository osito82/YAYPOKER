import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...prettier.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-useless-assignment': 'warn',
      'no-empty': 'warn',
    },
  },
  {
    ignores: ['node_modules/**'],
  },
]
