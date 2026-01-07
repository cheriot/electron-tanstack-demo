import {
  ToolLoopAgent,
  convertToModelMessages,
  gateway,
  stepCountIs,
  tool,
} from 'ai'
import { z } from 'zod'
import type {
  AgentConfig,
  AgentGenerateResult,
  AgentInput,
  AgentStreamResult,
} from './types'

const WEATHER_AGENT_CONFIG: AgentConfig = {
  model: gateway('xai/grok-code-fast-1'),
  maxSteps: 5,
}

/**
 * Tool input schemas
 */

const weatherInputSchema = z.object({
  location: z.string().describe('The location to get the weather for'),
})

const convertFahrenheitToCelsiusInputSchema = z.object({
  temperature: z.number().describe('The temperature in fahrenheit to convert'),
})

/**
 * Weather tool
 */
const weatherTool = tool({
  description: 'Get the weather in a location (fahrenheit)',
  inputSchema: weatherInputSchema,
  execute: ({ location }) => {
    const temperature = Math.round(Math.random() * (90 - 32) + 32)
    return {
      location,
      temperature,
    }
  },
})

/**
 * Convert fahrenheit to celsius tool
 */
const convertFahrenheitToCelsiusTool = tool({
  description: 'Convert a temperature in fahrenheit to celsius',
  inputSchema: convertFahrenheitToCelsiusInputSchema,
  execute: ({ temperature }) => {
    const celsius = Math.round((temperature - 32) * (5 / 9))
    return {
      celsius,
    }
  },
})

/**
 * Weather agent tools
 *
 * Exported for type inference in message-types.ts
 */
export const WEATHER_TOOLS = {
  weather: weatherTool,
  convertFahrenheitToCelsius: convertFahrenheitToCelsiusTool,
}

/**
 * Create a weather agent instance
 */
function createWeatherAgent(config: AgentConfig) {
  return new ToolLoopAgent({
    model: config.model,
    tools: WEATHER_TOOLS,
    stopWhen: stepCountIs(config.maxSteps ?? 5),
    instructions: config.systemPrompt,
  })
}

/**
 * Stream weather agent responses
 *
 * Use this in API routes to stream responses to the client.
 *
 * @example
 * ```typescript
 * const result = await streamWeatherAgent({ messages })
 * return result.toUIMessageStreamResponse()
 * ```
 */
export async function streamWeatherAgent(
  input: AgentInput,
): Promise<AgentStreamResult> {
  const config = { ...WEATHER_AGENT_CONFIG, ...input.config }
  const agent = createWeatherAgent(config)

  // Use the agent's stream method to get the StreamTextResult
  const stream = await agent.stream({
    prompt: await convertToModelMessages(input.messages),
  })

  return {
    stream,
    toUIMessageStreamResponse: () => stream.toUIMessageStreamResponse(),
  }
}

/**
 * Generate weather agent response (non-streaming)
 *
 * Use this in tests, evals, and CLI utilities.
 *
 * @example
 * ```typescript
 * const result = await generateWeatherAgent({
 *   messages: [{ role: 'user', content: 'What is the weather in NYC?' }]
 * })
 * console.log(result.text)
 * ```
 */
export async function generateWeatherAgent(
  input: AgentInput,
): Promise<AgentGenerateResult> {
  const config = { ...WEATHER_AGENT_CONFIG, ...input.config }
  const agent = createWeatherAgent(config)

  const result = await agent.generate({
    prompt: await convertToModelMessages(input.messages),
  })

  // Extract tool calls from the result
  const toolCalls = result.steps.flatMap((step) =>
    step.toolResults.map((tr) => ({
      toolName: tr.toolName,
      input: tr.input,
      output: tr.output,
    })),
  )

  return {
    messages: [], // Would need to reconstruct UIMessages from result
    toolCalls,
    text: result.text,
  }
}
