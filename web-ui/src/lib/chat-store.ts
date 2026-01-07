import { generateId } from 'ai'
import type { UIMessage } from 'ai'

/**
 * In-memory chat storage
 * This is a mock implementation - replace with database or file storage in production
 */
const chatStore = new Map<string, Array<UIMessage>>()

/**
 * Create a new chat and return its ID
 */
export async function createChat(): Promise<string> {
  const id = generateId()
  chatStore.set(id, [])
  return id
}

/**
 * Load chat messages by ID
 */
export async function loadChat(id: string): Promise<Array<UIMessage>> {
  return chatStore.get(id) ?? []
}

/**
 * Save chat messages
 */
export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string
  messages: Array<UIMessage>
}): Promise<void> {
  chatStore.set(chatId, messages)
}
