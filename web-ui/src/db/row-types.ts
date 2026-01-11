import type { chats, messages, todos } from './schema'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type TodoRow = InferSelectModel<typeof todos>
export type NewTodoRow = InferInsertModel<typeof todos>

export type ChatRow = InferSelectModel<typeof chats>
export type NewChatRow = InferInsertModel<typeof chats>

export type MessageRow = InferSelectModel<typeof messages>
export type NewMessageRow = InferInsertModel<typeof messages>
