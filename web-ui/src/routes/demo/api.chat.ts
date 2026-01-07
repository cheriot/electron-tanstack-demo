import { createFileRoute } from '@tanstack/react-router'
import { createIdGenerator } from 'ai'
import type { UIMessage } from 'ai'
import { streamWeatherAgent } from '@/lib/agents'
import { loadChat, saveChat } from '@/lib/chat-store'

export const Route = createFileRoute('/demo/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, id }: { message: UIMessage; id: string } =
          await request.json()

        // Load previous messages from chat store
        const previousMessages = await loadChat(id)

        // Append new message to previous messages
        const messages = [...previousMessages, message]

        const result = await streamWeatherAgent({ messages })

        return result.stream.toUIMessageStreamResponse({
          originalMessages: messages,
          // Generate consistent server-side IDs for persistence
          generateMessageId: createIdGenerator({
            prefix: 'msg',
            size: 16,
          }),
          onFinish: ({ messages }) => {
            saveChat({ chatId: id, messages })
          },
        })
      },
    },
  },
})
