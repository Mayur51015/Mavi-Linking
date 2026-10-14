// vitestShim.cjs - Bridge for Vitest API imports when running under Jest
const viMock = {
  fn: (...args) => (globalThis.jest ? globalThis.jest.fn(...args) : () => {}),
  spyOn: (...args) => (globalThis.jest ? globalThis.jest.spyOn(...args) : () => {}),
  mock: (...args) => (globalThis.jest ? globalThis.jest.mock(...args) : () => {}),
  clearAllMocks: () => (globalThis.jest ? globalThis.jest.clearAllMocks() : undefined),
  resetAllMocks: () => (globalThis.jest ? globalThis.jest.resetAllMocks() : undefined),
  restoreAllMocks: () => (globalThis.jest ? globalThis.jest.restoreAllMocks() : undefined),
};

module.exports = {
  describe: (...args) => globalThis.describe(...args),
  it: (...args) => globalThis.it(...args),
  test: (...args) => globalThis.test(...args),
  expect: (...args) => globalThis.expect(...args),
  beforeEach: (...args) => globalThis.beforeEach(...args),
  afterEach: (...args) => globalThis.afterEach(...args),
  beforeAll: (...args) => globalThis.beforeAll(...args),
  afterAll: (...args) => globalThis.afterAll(...args),
  vi: viMock,
  default: {
    vi: viMock,
  },
};
