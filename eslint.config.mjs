import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'
import typescriptEslint from '@typescript-eslint/eslint-plugin'

const ignorePaths = ['node_modules', 'public', 'assets', 'cypress.json', 'reporter-config.json', 'dist/', 'scripts/']

const defaultConfig = hmppsConfig({
  extraIgnorePaths: [
    'integration_tests/parent_app/',
    ...ignorePaths.map(path => `integration_tests/${path}`),
    ...ignorePaths.map(path => `${path}`),
  ],
})

defaultConfig.push({
  rules: {
    'import/prefer-default-export': 'off',
    'dot-notation': 'off',
  },
})

defaultConfig.push({
  plugins: {
    '@typescript-eslint': typescriptEslint,
  },
  rules: {
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      1,
      {
        argsIgnorePattern: 'res|next|^err|_',
        ignoreRestSiblings: true,
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
})

export default defaultConfig
