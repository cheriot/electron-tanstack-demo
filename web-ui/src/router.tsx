import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { getNonce } from './lib/get-nonce'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
    </div>
  )
}

// Create a new router instance
export async function getRouter() {
  const rqContext = TanstackQuery.getContext()

  let nonce: string | undefined
  if (typeof window === 'undefined') {
    nonce = await getNonce()
  }

  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
    },
    ssr: { nonce },
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFoundComponent,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}
