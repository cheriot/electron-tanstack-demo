import { createFileRoute } from '@tanstack/react-router'
import type { StoredUIMessage } from '@/lib/message-types'
import { streamWeatherAgent } from '@/lib/agents'
import { loadChat, upsertMessage } from '@/lib/dao/chatDao'
import { db } from '@/db'

/**
 * Check if a message contains a tool with approval-responded state
 */
function hasApprovalResponse(
  message: StoredUIMessage,
  approved: boolean
): boolean {
  return (
    message.role === 'assistant' &&
    message.parts.some(
      (part) =>
        'state' in part &&
        part.state === 'approval-responded' &&
        'approval' in part &&
        (part.approval as { approved?: boolean })?.approved === approved
    )
  )
}

export const Route = createFileRoute('/demo/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, id }: { message: StoredUIMessage; id: string } =
          await request.json()

        // Save incoming message (user message OR assistant with approval response)
        await upsertMessage({ chatId: id, message, db })

        // For denied approvals, just save and return empty response
        if (hasApprovalResponse(message, false)) {
          return new Response('', {
            headers: { 'Content-Type': 'text/event-stream' },
          })
        }

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
          onFinish: async ({ responseMessage }) => {
            // Save assistant response
            await upsertMessage({
              chatId: id,
              message: responseMessage,
              db,
            })
          },
        })
      },
    },
  },
})
