/**
 * AI Agents
 *
 * This module provides reusable agent implementations that can be used
 * across API routes, tests, evaluations, and CLI utilities.
 */

// Export types
export type {
  AgentConfig,
  AgentGenerateResult,
  AgentInput,
  AgentStreamResult,
} from './types'

// Export weather agent
export { generateWeatherAgent, streamWeatherAgent } from './weather-agent'
