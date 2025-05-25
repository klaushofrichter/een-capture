import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginPlaywright from 'eslint-plugin-playwright'
import globals from 'globals'

export default [
  // Base JavaScript configuration
  js.configs.recommended,

  // Vue.js configuration
  ...pluginVue.configs['flat/recommended'],

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true
        }
      }
    },
    rules: {
      // Vue-specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-unused-components': 'warn',
      
      // General rules
      'no-unused-vars': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  },

  // Playwright test configuration for all test files
  {
    files: ['tests/**/*.js', 'playwright.config.js'],
    ...pluginPlaywright.configs['flat/recommended'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      },
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true
        }
      }
    },
    rules: {
      ...pluginPlaywright.configs['flat/recommended'].rules,
      'no-unused-vars': 'warn',
      // Allow waitForTimeout in specific cases where needed
      'playwright/no-wait-for-timeout': 'warn'
    }
  },

  // Prettier configuration (must be last)
  eslintConfigPrettier,

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.git/**',
      '.husky/**',
      '.wrangler/**',
      'cloudflare/**',
      'test-results/**',
      'playwright-report/**'
    ]
  }
] 