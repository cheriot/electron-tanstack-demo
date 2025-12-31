# Plan: Secure Localhost Server with Shared Secret

## Problem
The embedded Nitro server on localhost is accessible to any process on the machine. A malicious process could access user data via the HTTP API.

## Solution
Generate a cryptographic secret at startup, inject it into all requests via Electron's webRequest API, and validate it server-side.

## Implementation

### 1. Generate secret and pass to server
**File:** `desktop/src/server.ts`

- Export a `generateSecret()` function using `crypto.randomBytes(32).toString('hex')`
- Accept secret as parameter to `startServer(secret: string)`
- Set `process.env.ELECTRON_AUTH_SECRET = secret` before importing Nitro

```typescript
import crypto from 'node:crypto'

export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function startServer(secret: string): Promise<number> {
  // ... existing code ...
  process.env.ELECTRON_AUTH_REQUIRED = 'true'
  process.env.ELECTRON_AUTH_SECRET = secret
  // ... import and start server ...
}
```

### 2. Inject header via webRequest API
**File:** `desktop/src/main.ts`

Extract a helper function for the server URL (single source of truth), then use it for both `loadURL` and the webRequest filter:

```typescript
import { generateSecret } from './server'

// Single source of truth for server URL
function getServerUrl(port: number): string {
  return app.isPackaged
    ? `http://127.0.0.1:${port}`
    : `http://localhost:${port}`
}

const createWindow = async () => {
  const secret = generateSecret()
  serverPort = await startServer(secret)

  const serverUrl = getServerUrl(serverPort)

  // Inject auth header into all requests to our server
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${serverUrl}/*`] },
    (details, callback) => {
      details.requestHeaders['X-Electron-Auth'] = secret
      callback({ requestHeaders: details.requestHeaders })
    }
  )

  // ... create window ...

  // Load from the server (uses same URL source)
  mainWindow.loadURL(serverUrl)

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
}
```

### 3. Create auth middleware
**New file:** `web-ui/src/middleware/electron-auth.ts`

```typescript
import crypto from 'node:crypto'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export const electronAuthMiddleware = createMiddleware().server(({ next }) => {
  const authRequired = process.env.ELECTRON_AUTH_REQUIRED !== 'false'

  // Auth disabled via ELECTRON_AUTH_REQUIRED=false
  if (!authRequired) {
    return next()
  }

  const expectedSecret = process.env.ELECTRON_AUTH_SECRET
  if (!expectedSecret) {
    throw new Response('ELECTRON_AUTH_SECRET_NOT_SET', { status: 500 })
  }

  const headers = getRequestHeaders()
  const providedSecret = headers.get('x-electron-auth') || ''

  if (!timingSafeEqual(providedSecret, expectedSecret)) {
    throw new Response('ELECTRON_AUTH_INVALID', { status: 401 })
  }

  return next()
})
```

### 4. Register middleware
**File:** `web-ui/src/start.ts`

```typescript
import { electronAuthMiddleware } from './middleware/electron-auth'
import { cspMiddleware } from './middleware/csp'

export const startInstance = createStart(() => ({
  requestMiddleware: [electronAuthMiddleware, cspMiddleware],
}))
```

## Development Mode Handling

Control auth via `ELECTRON_AUTH_SECRET` env var set in `.env`:

### 5. Add .env file for dev
**New file:** `web-ui/.env`

```
# Set to "false" to disable auth for standalone web development
ELECTRON_AUTH_REQUIRED=false

# Required when ELECTRON_AUTH_REQUIRED is not "false"
# ELECTRON_AUTH_SECRET=dev-secret-for-testing
```

**Scenarios:**
1. `pnpm dev:web` (auth disabled): Set `ELECTRON_AUTH_REQUIRED=false` in .env
2. `pnpm dev:web` (auth enabled): Set both vars for testing auth flow locally
3. `pnpm dev:desktop`: Electron sets both env vars before starting server
4. Production: Electron sets `ELECTRON_AUTH_REQUIRED=true` and random secret

## Files to Modify
- `desktop/src/server.ts` - Add `generateSecret()`, accept secret param
- `desktop/src/main.ts` - Generate secret, inject header via webRequest
- `web-ui/src/start.ts` - Register auth middleware

## New Files
- `web-ui/src/middleware/electron-auth.ts` - Auth validation middleware
- `web-ui/.env` - Dev config with optional `ELECTRON_AUTH_SECRET`

## Security Notes
- Secret is 256-bit random, generated fresh each launch
- Never persisted to disk
- Header is timing-safe compared using constant-time comparison (use `crypto.timingSafeEqual`)
- Only checked in production when `ELECTRON_AUTH_SECRET` is set
