import {
  convertToModelMessages,
  gateway,
  stepCountIs,
  streamText, tool 
} from 'ai'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import type {
  UIMessage} from 'ai';

export const Route = createFileRoute('/demo/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages }: { messages: Array<UIMessage> } = await request.json()

        const result = streamText({
          model: gateway('xai/grok-code-fast-1'),
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(5),
          tools: {
            weather: tool({
              description: 'Get the weather in a location (fahrenheit)',
              inputSchema: z.object({
                location: z
                  .string()
                  .describe('The location to get the weather for'),
              }),
              execute: ({ location }) => {
                const temperature = Math.round(Math.random() * (90 - 32) + 32)
                return {
                  location,
                  temperature,
                }
              },
            }),
            convertFahrenheitToCelsius: tool({
              description: 'Convert a temperature in fahrenheit to celsius',
              inputSchema: z.object({
                temperature: z
                  .number()
                  .describe('The temperature in fahrenheit to convert'),
              }),
              execute: ({ temperature }) => {
                const celsius = Math.round((temperature - 32) * (5 / 9))
                return {
                  celsius,
                }
              },
            }),
          },
        })

        return result.toUIMessageStreamResponse()
      },
    },
  },
})
