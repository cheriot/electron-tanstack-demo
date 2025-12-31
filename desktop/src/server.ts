import crypto from 'node:crypto'
import { createServer, type Server } from 'node:http'
import path from 'node:path'
import { app } from 'electron'
import getPort from 'get-port'

export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

let server: Server | null = null

export async function startServer(secret: string): Promise<number> {
  const isDev = !app.isPackaged

  if (isDev) {
    // In development, web-ui runs its own dev server on port 3000
    // We don't start a server here, just return the port where web-ui is running
    // ELECTRON_AUTH is left off so using web-ui in a browser still works.
    return 3000
  }

  // Get available port for production, preferring 3000
  const serverPort = await getPort({ port: 3000 })

  // Production: Start embedded Nitro server
  const serverDir = path.join(process.resourcesPath, '.output', 'server')

  // Set environment variables before importing the server
  process.env.ELECTRON_APP_PATH = app.getPath('userData')
  process.env.NODE_ENV = 'production'
  process.env.ELECTRON_AUTH_REQUIRED = 'true'
  process.env.ELECTRON_AUTH_SECRET = secret

  // Dynamic import of the built Nitro server
  const { listener } = await import(path.join(serverDir, 'index.mjs'))

  server = createServer(listener)

  return new Promise((resolve, reject) => {
    server.listen(serverPort, '127.0.0.1', () => {
      console.log(`Nitro server started on port ${serverPort}`)
      resolve(serverPort)
    })

    server.on('error', reject)
  })
}

export async function stopServer(): Promise<void> {
  if (server) {
    return new Promise((resolve) => {
      server.close(() => {
        server = null
        resolve()
      })
    })
  }
}
