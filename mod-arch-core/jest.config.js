// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  roots: ['<rootDir>/'],
  testMatch: [
    '**/__tests__/unit/**/?(*.)+(spec|test).ts?(x)',
    '**/__tests__/?(*.)+(spec|test).ts?(x)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', '<rootDir>/'],

  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/config/transform.style.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/config/transform.file.js',
    '~/(.*)': '<rootDir>/$1',
  },

  // The test environment that will be used for testing.
  testEnvironment: 'jest-environment-jsdom',

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest', // Process .js, .jsx, .ts, .tsx files with ts-jest
  },

  // include projects from node_modules as required
  transformIgnorePatterns: ['node_modules/(?!yaml|lodash-es|uuid|delaunator)'],

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: [],

  setupFilesAfterEnv: ['<rootDir>/__tests__/unit/jest.setup.ts'],

  coverageDirectory: 'jest-coverage',

  collectCoverageFrom: [
    '<rootDir>/**/*.{ts,tsx}',
    '!<rootDir>/__tests__/**',
    '!<rootDir>/__mocks__/**',
    '!**/*.spec.{ts,tsx}',
  ],
};
