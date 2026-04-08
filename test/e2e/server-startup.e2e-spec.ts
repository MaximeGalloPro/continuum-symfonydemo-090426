import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, type ChildProcess } from 'child_process'

/**
 * Real E2E test: starts the NestJS server and makes HTTP requests.
 * This validates that the server actually starts and responds correctly.
 */
describe('Server Startup E2E', () => {
  let serverProcess: ChildProcess | null = null
  const PORT = process.env.E2E_PORT || '3001' // Use different port to avoid conflicts
  const BASE_URL = `http://localhost:${PORT}`

  // Wait for server to be ready by polling /health
  async function waitForServer(url: string, timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now()
    const pollInterval = 500

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          return // Server is ready
        }
      } catch {
        // Server not ready yet, keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    throw new Error(`Server did not start within ${timeoutMs}ms`)
  }

  beforeAll(async () => {
    // Start the NestJS server
    serverProcess = spawn('node', ['dist/main.js'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT,
        NODE_ENV: 'test',
      },
    })

    // Capture output for debugging
    serverProcess.stdout?.on('data', (data) => {
      console.log(`[server] ${data.toString().trim()}`)
    })

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[server:err] ${data.toString().trim()}`)
    })

    // Wait for server to be ready
    await waitForServer(`${BASE_URL}/health`, 30000)
  }, 35000) // Increase test timeout for server startup

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM')
      // Wait for process to exit
      await new Promise<void>((resolve) => {
        serverProcess?.on('exit', () => resolve())
        setTimeout(resolve, 2000) // Timeout fallback
      })
      serverProcess = null
    }
  })

  it('should respond to GET /health', async () => {
    const response = await fetch(`${BASE_URL}/health`)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('status', 'ok')
    expect(body).toHaveProperty('timestamp')
  })

  it('should return 404 for unknown routes', async () => {
    const response = await fetch(`${BASE_URL}/unknown-route-xyz`)
    expect(response.status).toBe(404)
  })

  it('should have correct content-type header', async () => {
    const response = await fetch(`${BASE_URL}/health`)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
  })
})
