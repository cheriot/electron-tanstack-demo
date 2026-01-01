import globals from "globals";
import js from "@eslint/js";
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';

export default tseslint.config(
    {
        ignores: [
            ".vite/**",
            "out/**",
            "dist/**",
            "node_modules/**",
            "*.config.*",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
    security.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        settings: {
            // Electron-specific settings
            'import/core-modules': ['electron'],
            'import/external-module-folders': ['node_modules', 'node_modules/@electron'],
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_' },
            ],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
        },
    }
);