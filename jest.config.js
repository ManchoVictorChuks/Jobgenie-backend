module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/testSetup.js'],
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/?(*.)+(spec|test).js']
};
