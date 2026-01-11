import { z } from 'zod'
import type { WEATHER_TOOLS } from './agents/weather-agent'
import type { InferUITools, UIMessage, UIMessagePart } from 'ai'

// Documentation on how to customize UIMessage
// https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message

/**
 * Data parts for progressive UI updates
 *
 * Use with createUIMessageStream to send typed data to the client
 * before tool execution completes.
 *
 * @example
 * ```ts
 * writer.write({
 *   type: 'data-weather',
 *   data: { loading: true, location: 'NYC' }
 * })
 * ```
 */
export type AppDataParts = {
  weather: {
    loading: boolean
    location?: string
    temperature?: number
  }
}

/**
 * Current tools
 *
 * This gives us compile-time type checking for tool inputs/outputs
 * when streaming new messages.
 */
export type CurrentTools = InferUITools<typeof WEATHER_TOOLS>

/**
 * Historical tools no longer active on any agent but stored in the DB
 *
 * When you remove a tool from an agent, move its type definition here
 * to maintain type safety when loading old messages.
 *
 * @example
 * ```ts
 * type HistoricalTools = {
 *   // Removed in v2 - replaced by weather tool
 *   getTemperature: {
 *     input: { city: string }
 *     output: { fahrenheit: number }
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type HistoricalTools = {
  // Add deprecated tool types here as you remove them from agents
}

/**
 * All tools the system has ever used
 *
 * Union of current and historical tools for DB compatibility.
 */
export type AllTools = CurrentTools & HistoricalTools

/**
 * UIMessage type for streaming new responses
 *
 * Use this when creating new messages via streamText/agent.stream.
 * Provides strict type checking against current tools only.
 */
export type CurrentUIMessage = UIMessage<never, AppDataParts, CurrentTools>

/**
 * UIMessage type for DB persistence and loading
 *
 * Use this when reading/writing messages to the database.
 * Accepts both current and historical tool invocations.
 */
export type StoredUIMessage = UIMessage<never, AppDataParts, AllTools>

/**
 * Message part type for rendering in components
 *
 * Use this when iterating over message.parts in React components.
 */
export type AppMessagePart = UIMessagePart<AppDataParts, AllTools>

export const AppDataSchemas = {
  weather: z.object({
    loading: z.boolean(),
    location: z.string().optional(),
    temperature: z.number().optional(),
  }),
}

export const MessageMetadataSchema = z.undefined().optional()
