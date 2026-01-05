// @ts-check

import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { tanstackConfig } from '@tanstack/eslint-config'
import query from '@tanstack/eslint-plugin-query'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

export default [
  ...tanstackConfig,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  ...query.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  {
    rules: {
      // This one can be used appropriately.
      'jsx-a11y/no-autofocus': 'off',
      // These two don't see children passed through ...props
      'jsx-a11y/anchor-has-content': 'off',
      'jsx-a11y/heading-has-content': 'off',
    },
  },
  {
    ignores: [
      '*.config.js',
      '.output/**',
      '.vinxi/**',
      'dist/**',
      'src/components/ai-elements/**',
    ],
  },
]
