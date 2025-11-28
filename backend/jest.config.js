/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // Transform ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  // Mock uuid module
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/__mocks__/uuid.ts'
  },
};
