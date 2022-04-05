/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: [
    '**/?(*.)+(test).ts'
  ],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    "**/*.{ts,jsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/dist/**"
  ]
}