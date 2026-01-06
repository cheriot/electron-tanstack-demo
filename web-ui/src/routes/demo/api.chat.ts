import { createFileRoute } from '@tanstack/react-router'
import type { UIMessage } from 'ai'
import { streamWeatherAgent } from '@/lib/agents'

export const Route = createFileRoute('/demo/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages }: { messages: Array<UIMessage> } =
          await request.json()

        const result = await streamWeatherAgent({ messages })

        return result.toUIMessageStreamResponse()
      },
    },
  },
})
