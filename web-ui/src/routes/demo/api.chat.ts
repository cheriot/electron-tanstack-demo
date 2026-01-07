import { createFileRoute } from '@tanstack/react-router'
import type { StoredUIMessage } from '@/lib/message-types'
import { streamWeatherAgent } from '@/lib/agents'
import { loadChat, upsertMessage } from '@/lib/dao/chatDao'
import { db } from '@/db'

export const Route = createFileRoute('/demo/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, id }: { message: StoredUIMessage; id: string } =
          await request.json()

        // Save user message first
        upsertMessage({ chatId: id, id: message.id, message, db })

        // Load all messages including the one we just saved
        const messages = await loadChat(id, db)

        const result = await streamWeatherAgent({ messages })

        return result.stream.toUIMessageStreamResponse({
          originalMessages: messages,
          onError: (error) => {
            // Error messages are masked by default for security reasons.
            // If you want to expose the error message to the client, you can do so here:
            return error instanceof Error ? error.message : String(error)
          },
          onFinish: ({ responseMessage }) => {
            // Save assistant response
            upsertMessage({
              chatId: id,
              id: responseMessage.id,
              message: responseMessage,
              db,
            })
          },
        })
      },
    },
  },
})
