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
    console.warn('WARNING: Electron authentication is disabled. This should only be used in development.')
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
