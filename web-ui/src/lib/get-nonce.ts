import { createServerOnlyFn } from '@tanstack/react-start'

// Whole point of the nonce is that it's unknown to client javascript. See
// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce
export const getNonce = createServerOnlyFn(async () => {
  // This dynamic import needs to be inside createServerOnlyFn so it'll be treeshaken
  // out of client bundles.
  const { getStartContext } = await import('@tanstack/start-storage-context')
  const context = getStartContext()
  return context.contextAfterGlobalMiddlewares?.nonce
})
