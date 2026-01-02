import { createServerFn } from '@tanstack/react-start'

export const getNonce = createServerFn({ method: 'GET' }).handler(async () => {
  // This dynamic import needs to be inside createServerFn so it'll be treeshaken
  // out of client bundles.
  const { getStartContext } = await import('@tanstack/start-storage-context')
  const context = getStartContext()
  return context.contextAfterGlobalMiddlewares?.nonce
})
