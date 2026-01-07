import type { LanguageModel, StreamTextResult } from 'ai'
import type { StoredUIMessage } from '../message-types'

/**
 * Agent configuration
 */
export interface AgentConfig {
  model: LanguageModel
  maxSteps?: number
  systemPrompt?: string
}

/**
 * Input/Output types
 */
export interface AgentInput {
  messages: Array<StoredUIMessage>
  config?: Partial<AgentConfig>
}

export interface AgentStreamResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream: StreamTextResult<any, any>
  toUIMessageStreamResponse: () => Response
}

export interface AgentGenerateResult {
  messages: Array<StoredUIMessage>
  toolCalls: Array<{
    toolName: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any
  }>
  text: string
}
