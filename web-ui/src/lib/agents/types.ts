import type { LanguageModel, StreamTextResult, UIMessage } from 'ai'

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
  messages: Array<UIMessage>
  config?: Partial<AgentConfig>
}

export interface AgentStreamResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream: StreamTextResult<any, any>
  toUIMessageStreamResponse: () => Response
}

export interface AgentGenerateResult {
  messages: Array<UIMessage>
  toolCalls: Array<{
    toolName: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any
  }>
  text: string
}
