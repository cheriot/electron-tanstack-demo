import { createStart } from '@tanstack/react-start'
import { cspMiddleware } from './middleware/csp'

export const startInstance = createStart(() => ({
  requestMiddleware: [cspMiddleware],
}))
