import { and, eq, gt } from 'drizzle-orm'
import { chats, messages } from '../../db/schema.ts'
import { StoredMessageSchema } from '../message-schema'
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
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, id))
    .orderBy(messages.createdAt)

  return result.map(
    (msg) =>
      StoredMessageSchema.parse({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
      }) as StoredUIMessage,
  )
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

  // Validate messages before storing (throws on invalid data)
  msgs.forEach((msg) => StoredMessageSchema.parse(msg))

  await db.insert(messages).values(
    msgs.map((msg) => ({
      id: msg.id,
      chatId,
      role: msg.role,
      parts: msg.parts,
    })),
  )
}

export const upsertMessage = ({
  chatId,
  message,
  id,
  db,
}: {
  id: string
  chatId: string
  message: StoredUIMessage
  db: DB
}) => {
  // Validate message before storing (throws on invalid data)
  StoredMessageSchema.parse(message)

  db.insert(messages)
    .values({
      chatId,
      role: message.role,
      parts: message.parts,
      id,
    })
    .onConflictDoUpdate({
      target: messages.id,
      set: {
        role: message.role,
        parts: message.parts,
      },
    })
    .run()
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
