import { z } from 'zod'

// JSON types matching ai-sdk's JSONValue
type JSONValue =
  | string
  | number
  | boolean
  | null
  | Array<JSONValue>
  | { [key: string]: JSONValue }

const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
)

const jsonObjectSchema = z.record(z.string(), jsonValueSchema)

// Chat message parts - runtime validation for DB persistence
// These schemas validate structure while the TypeScript types in message-types.ts
// provide compile-time checking for tool inputs/outputs.

const TextPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  state: z.enum(['streaming', 'done']).optional(),
  providerMetadata: z.record(z.string(), jsonObjectSchema).optional(),
})

const DataPartSchema = z.object({
  type: z.string().startsWith('data-'),
  data: jsonValueSchema,
})

// Tool parts use a flexible schema that accepts any tool-* type
// This allows historical tools to deserialize without schema updates
const ToolPartSchema = z.object({
  type: z.string().startsWith('tool-'),
  toolCallId: z.string(),
  toolName: z.string(),
  state: z.enum([
    'partial-call',
    'call',
    'result',
    'error',
    'input-streaming',
    'input-available',
    'approval-requested',
    'approval-responded',
    'output-available',
    'output-error',
    'output-denied',
  ]),
  input: jsonObjectSchema.optional(),
  output: jsonValueSchema.optional(),
  errorText: z.string().optional(),
})

// Union of all part types - uses refine instead of discriminatedUnion
// to handle the dynamic tool-* and data-* prefixes
const MessagePartSchema = z.union([
  TextPartSchema,
  DataPartSchema,
  ToolPartSchema,
])

// Runtime validation for chat messages
// For TypeScript types, see StoredUIMessage in lib/message-types.ts
export const StoredMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(MessagePartSchema),
  metadata: z.undefined().optional(),
})
