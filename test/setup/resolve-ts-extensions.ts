/**
 * Node.js CJS require() hooks for TypeScript support.
 *
 * Two problems are solved here:
 *
 *  1. Resolution:  require('foo.js') must find 'foo.ts' when the .js file
 *     does not exist (standard TypeScript NodeNext extension stubs).
 *     Fixed by patching Module._resolveFilename.
 *
 *  2. Compilation: once the .ts file is found, Node's CJS loader must be
 *     able to execute it.  TypeScript syntax is invalid JS, so we register
 *     a Module._extensions['.ts'] handler that transpiles via @swc/core
 *     (same toolchain already used by unplugin-swc in the Vite pipeline).
 */
import Module from 'node:module'
import { readFileSync } from 'node:fs'
import { transformSync } from '@swc/core'

// ── 1. .js → .ts resolution ──────────────────────────────────────────────────

const originalResolve: (
  request: string,
  parent: NodeModule | null,
  isMain: boolean,
  options?: Record<string, unknown>,
) => string = (Module as unknown as Record<string, unknown>)
  ._resolveFilename as never

;(Module as unknown as Record<string, unknown>)._resolveFilename = function (
  request: string,
  parent: NodeModule | null,
  isMain: boolean,
  options?: Record<string, unknown>,
): string {
  if (request.startsWith('.') && request.endsWith('.js')) {
    const tsRequest = request.slice(0, -3) + '.ts'
    try {
      return originalResolve.call(Module, tsRequest, parent, isMain, options)
    } catch {
      // .ts counterpart not found — fall through to .js
    }
  }
  return originalResolve.call(Module, request, parent, isMain, options)
}

// ── 2. TypeScript CJS loader ──────────────────────────────────────────────────

;(Module as unknown as Record<string, string>)._extensions[
  '.ts'
] = function (mod: NodeModule & { _compile: (code: string, filename: string) => void }, filename: string) {
  const source = readFileSync(filename, 'utf8')
  const { code } = transformSync(source, {
    filename,
    jsc: {
      parser: { syntax: 'typescript', decorators: true },
      transform: { decoratorMetadata: true, legacyDecorator: true },
      target: 'es2022',
    },
    module: { type: 'commonjs' },
  })
  mod._compile(code, filename)
}
