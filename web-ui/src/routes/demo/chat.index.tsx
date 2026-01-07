import { createFileRoute, redirect } from '@tanstack/react-router'
import { createChat } from '@/lib/chat-store'

export const Route = createFileRoute('/demo/chat/')({
  beforeLoad: async () => {
    const id = await createChat()
    throw redirect({
      to: '/demo/chat/$id',
      params: { id },
    })
  },
})
