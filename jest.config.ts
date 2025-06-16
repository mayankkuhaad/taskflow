// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'], 
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/test/jest-setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.entity.ts',
    '!src/**/index.ts',
    '!src/**/*.spec.ts', 
    '!src/common/providers/redis.provider.ts', 
    '!src/common/services/cache.service.ts', 
    '!src/common/guards/rate-limit.guard.ts', 
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};

export default config;
