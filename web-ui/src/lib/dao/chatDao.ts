import { and, eq, gt } from 'drizzle-orm'
import { chats, messages } from '../../db/schema.ts'
import {
  rowToStoredUIMessage,
  safeValidate,
  storedUIMessageToRow,
} from '../message-validation'
import type { DB } from '../../db/index.ts'
import type { StoredUIMessage } from '../message-types'

/**
 * Create a new chat and return its ID
 */
export async function createChat(db: DB): Promise<string> {
  const [chat] = await db.insert(chats).values({}).returning()
  return chat.id
}

/**
 * Load chat messages by ID
 *
 * Returns StoredUIMessage[] for ai-sdk compatibility.
 * Zod validates structure at runtime; the cast is safe.
 */
export async function loadChat(
  id: string,
  db: DB,
): Promise<Array<StoredUIMessage>> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, id))
    .orderBy(messages.createdAt)

  if (rows.length === 0) {
    return []
  }

  const stored = rows.map(rowToStoredUIMessage)
  const validation = await safeValidate(stored)

  if (!validation.success) {
    throw validation.error
  }

  return validation.data
}

/**
 * Insert new messages (does not delete existing ones)
 */
export async function insertMessages({
  chatId,
  messages: msgs,
  db,
}: {
  chatId: string
  messages: Array<StoredUIMessage>
  db: DB
}): Promise<void> {
  if (msgs.length === 0) return

  const validation = await safeValidate(msgs)
  if (!validation.success) {
    throw validation.error
  }

  await db
    .insert(messages)
    .values(msgs.map((msg) => storedUIMessageToRow(msg, chatId)))
}

export const upsertMessage = async ({
  chatId,
  message,
  db,
}: {
  chatId: string
  message: StoredUIMessage
  db: DB
}) => {
  const validation = await safeValidate([message])
  if (!validation.success) {
    throw validation.error
  }

  const row = storedUIMessageToRow(message, chatId)
  await db
    .insert(messages)
    .values(row)
    .onConflictDoUpdate({
      target: messages.id,
      set: {
        role: row.role,
        parts: row.parts,
      },
    })
}

export const getChats = async (db: DB) => {
  return await db.select().from(chats)
}

export const deleteChat = async (chatId: string, db: DB) => {
  await db.delete(chats).where(eq(chats.id, chatId))
}

export const deleteMessage = (messageId: string, db: DB) => {
  db.transaction((tx) => {
    const [targetMessage] = tx
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
      .all()

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!targetMessage) return

    // Delete all messages after this one in the chat
    tx.delete(messages)
      .where(
        and(
          eq(messages.chatId, targetMessage.chatId),
          gt(messages.createdAt, targetMessage.createdAt),
        ),
      )
      .run()

    // Delete the target message
    tx.delete(messages).where(eq(messages.id, messageId)).run()
  })
}
