module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^vitest$': '<rootDir>/src/test/vitestShim.cjs',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test/fileMock.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(framer-motion|lucide-react|clsx)/)',
  ],
};
