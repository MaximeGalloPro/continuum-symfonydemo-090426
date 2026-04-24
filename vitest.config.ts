import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        target: 'es2022',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['test/**/*.spec.ts', 'test/**/*.integration-spec.ts'],
    globalSetup: './test/setup/global-setup.ts',
    // DATABASE_URL vient de l'environnement Docker (Postgres)
  },
})
