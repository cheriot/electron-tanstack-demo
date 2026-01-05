import { createFileRoute } from '@tanstack/react-router'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

export const Route = createFileRoute('/demo/chat')({
  component: Chat,
})

function Chat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/demo/api/chat',
    }),
  })

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <h1 className="text-2xl font-bold mb-4 text-white">AI Chat Demo</h1>
      <p className="text-gray-400 mb-8">
        Try asking about the weather! e.g. &quot;What&apos;s the weather in New York in
        celsius?&quot;
      </p>

      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          <span className="font-semibold text-cyan-400">
            {message.role === 'user' ? 'User: ' : 'AI: '}
          </span>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return (
                  <span key={`${message.id}-${i}`} className="text-gray-200">
                    {part.text}
                  </span>
                )
              case 'tool-weather':
              case 'tool-convertFahrenheitToCelsius':
                return (
                  <pre
                    key={`${message.id}-${i}`}
                    className="bg-slate-800 p-2 rounded mt-2 text-sm text-gray-300 overflow-auto"
                  >
                    {JSON.stringify(part, null, 2)}
                  </pre>
                )
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage({ text: input })
          setInput('')
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  )
}
