import { createMiddleware } from '@tanstack/react-start'
import { setResponseHeaders } from '@tanstack/react-start/server'

export const cspMiddleware = createMiddleware().server(({ next }) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", "'unsafe-inline'"],
    'worker-src': process.env.NODE_ENV === 'development' ? ["'self'", 'blob:'] : ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
  const cspHeader = Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')

  setResponseHeaders({
    'Content-Security-Policy': cspHeader,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  })

  return next({
    context: { nonce },
  })
})
