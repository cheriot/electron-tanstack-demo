import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export async function getRouter() {
  const rqContext = TanstackQuery.getContext()

  let nonce: string | undefined
  if (typeof window === 'undefined') {
    // Dynamic import for server-only code
    const { getStartContext } = await import('@tanstack/start-storage-context');
    const context = getStartContext();
    nonce = context.contextAfterGlobalMiddlewares?.nonce;
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
