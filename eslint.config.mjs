import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

const configLayers = hmppsConfig({
  extraIgnorePaths: ['assets/', 'integration_tests/hmpps-template-typescript'],
})
// currently, @ministryofjustice/eslint-config-hmpps sets ECMA version to 2018
for (const configLayer of configLayers) {
  if ('languageOptions' in configLayer && 'ecmaVersion' in configLayer.languageOptions) {
    configLayer.languageOptions.ecmaVersion = 2024
  }
}
export default configLayers
