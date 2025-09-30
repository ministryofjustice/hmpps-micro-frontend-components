import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

const ignorePaths = ['assets/', 'dist/', 'scripts/']
export default hmppsConfig({
  extraIgnorePaths: [...ignorePaths.map(path => `integration_tests/${path}`), ...ignorePaths.map(path => `${path}`)],
})
