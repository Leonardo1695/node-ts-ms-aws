module.exports = {
  displayName: 'messaging',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/messaging',
  testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.spec\\.ts$'],
};
