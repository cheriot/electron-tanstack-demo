import { createStart } from '@tanstack/react-start'
import { electronAuthMiddleware } from './middleware/electron-auth'
import { cspMiddleware } from './middleware/csp'

export const startInstance = createStart(() => ({
  requestMiddleware: [electronAuthMiddleware, cspMiddleware],
}))
