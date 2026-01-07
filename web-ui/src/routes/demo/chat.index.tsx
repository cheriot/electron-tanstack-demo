import { createFileRoute, redirect } from '@tanstack/react-router'
import { client } from '@/orpc/client'

export const Route = createFileRoute('/demo/chat/')({
  beforeLoad: async () => {
    const id = await client.createChat({})
    throw redirect({
      to: '/demo/chat/$id',
      params: { id },
    })
  },
})
