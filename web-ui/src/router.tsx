import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { getNonce } from './lib/get-nonce'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export async function getRouter() {
  const rqContext = TanstackQuery.getContext()

  let nonce: string | undefined
  if (typeof window === 'undefined') {
    // Get nonce from server function to avoid bundling server-only code in client
    nonce = await getNonce()
  }

  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
    },
    ssr: { nonce },
    defaultPreload: 'intent',
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}
