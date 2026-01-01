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
    ignores: ['*.config.js'],
  },
]
