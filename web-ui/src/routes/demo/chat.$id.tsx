import { createFileRoute } from '@tanstack/react-router'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { StoredUIMessage } from '@/lib/message-types'
import { client } from '@/orpc/client'

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'

export const Route = createFileRoute('/demo/chat/$id')({
  loader: async ({ params }) => {
    const messages = await client.loadChat({ id: params.id })
    return { messages, chatId: params.id }
  },
  component: Chat,
})

function Chat() {
  const { messages: initialMessages, chatId } = Route.useLoaderData()
  // Cast to StoredUIMessage for ai-sdk compatibility.
  // oRPC uses Zod types; useChat needs ai-sdk types.
  const { messages, sendMessage, status } = useChat<StoredUIMessage>({
    id: chatId,
    messages: initialMessages as unknown as Array<StoredUIMessage>,
    transport: new DefaultChatTransport({
      api: '/demo/api/chat',
      // eslint-disable-next-line no-shadow
      prepareSendMessagesRequest({ messages, id }) {
        // Only send the last message to the server
        return { body: { message: messages[messages.length - 1], id } }
      },
    }),
  })

  return (
    <div className="flex min-h-full w-full flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">AI Chat Demo</h1>
        <p className="text-muted-foreground text-sm">
          Try asking about the weather! e.g. &quot;What&apos;s the weather in
          New York in celsius?&quot;
        </p>
      </div>

      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask me anything about the weather!"
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        )
                      case 'tool-weather':
                      case 'tool-convertFahrenheitToCelsius':
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="rounded-lg bg-muted p-3 font-mono text-xs"
                          >
                            <div className="mb-1 font-semibold">
                              {part.type === 'tool-weather'
                                ? 'Weather Tool'
                                : 'Temperature Conversion'}
                            </div>
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(part, null, 2)}
                            </pre>
                          </div>
                        )
                    }
                  })}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        <PromptInput
          onSubmit={(message) => {
            sendMessage({ text: message.text })
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask me anything..." />
          </PromptInputBody>
          <PromptInputFooter>
            <div />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
