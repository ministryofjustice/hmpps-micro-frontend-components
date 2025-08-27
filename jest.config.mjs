export default {
  transform: {
    '^.+\\.tsx?$': ['ts-jest'],
    '^.+\\.jsx?$': 'babel-jest',
  },
  collectCoverageFrom: ['server/**/*.{ts,js,jsx,mjs}'],
  testMatch: ['<rootDir>/(server|job|scripts)/**/?(*.)(cy|test).{ts,js,jsx,mjs}'],
  setupFiles: ['<rootDir>/tests/setEnvVars.js'],
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test_results/jest/',
      },
    ],
    [
      './node_modules/jest-html-reporter',
      {
        outputPath: 'test_results/unit-test-reports.html',
      },
    ],
  ],
  moduleFileExtensions: ['web.js', 'js', 'json', 'node', 'ts'],
}
