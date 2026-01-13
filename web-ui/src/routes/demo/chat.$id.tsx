import { createFileRoute } from '@tanstack/react-router'
import { useChat } from '@ai-sdk/react'
// import { useSuspenseQuery } from '@tanstack/react-query'
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
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { Button } from '@/components/ui/button'

// Use this type alias, the satisfies check below, and a cast to work around
// ai-sdk 6's dynamic-tool type inference.
type UseChatMessage = StoredUIMessage

export const Route = createFileRoute('/demo/chat/$id')({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loader: async ({ params }): Promise<{ messages: any; id: string }> => {
    // Note: this function returns StoredUIMessages[] as any because of a type
    // inference issue with ai-sdk's dynamic-tool. Do not remove the "satisfies"
    // Keeping this hack in hopes ai-sdk fixes their type.
    const messages = (await client.loadChat({
      id: params.id,
    })) satisfies Array<UseChatMessage>

    return Promise.resolve({ messages, id: params.id })
  },
  component: Chat,
})

function Chat() {
  const { messages: initialMessages, id: chatId } = Route.useLoaderData()

  const { messages, sendMessage, status, addToolApprovalResponse } = useChat<UseChatMessage>({
    id: chatId,
    messages: initialMessages as Array<UseChatMessage>,
    // Auto-send to server when a tool approval is responded (approved or denied)
    sendAutomaticallyWhen: ({ messages: msgs }) => {
      const lastMessage = msgs.at(-1)
      return (
        lastMessage?.parts?.some(
          (part) =>
            'state' in part &&
            part.state === 'approval-responded' &&
            'approval' in part
        ) ?? false
      )
    },
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
                          <Tool key={`${message.id}-${i}`}>
                            <ToolHeader
                              title={
                                part.type === 'tool-weather'
                                  ? 'Weather'
                                  : 'Temperature Conversion'
                              }
                              type={part.type}
                              state={part.state}
                            />
                            <ToolContent>
                              <ToolInput input={part.input} />
                              {part.state === 'approval-requested' && (
                                <div className="flex gap-2 p-4">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      addToolApprovalResponse({
                                        id: part.approval.id,
                                        approved: true,
                                      })
                                    }
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      addToolApprovalResponse({
                                        id: part.approval.id,
                                        approved: false,
                                      })
                                    }
                                  >
                                    Deny
                                  </Button>
                                </div>
                              )}
                              <ToolOutput
                                output={part.output}
                                errorText={part.errorText}
                              />
                            </ToolContent>
                          </Tool>
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
