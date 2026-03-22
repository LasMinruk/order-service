module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/db.js',
    '!src/config/seed.js',
    '!src/services/**' 
  ],
  coverageReporters: ['lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
};