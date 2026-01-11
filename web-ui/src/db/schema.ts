import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { generateId } from 'ai'
import type { StoredUIMessage } from '../lib/message-types'

export const todos = sqliteTable('todos', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  title: text().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const chats = sqliteTable('chats', {
  id: text()
    .primaryKey()
    .$defaultFn(() => generateId()),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
})

export const messages = sqliteTable('messages', {
  id: text()
    .primaryKey()
    .$defaultFn(() => generateId()),
  chatId: text('chat_id')
    .references(() => chats.id, { onDelete: 'cascade' })
    .notNull(),
  role: text().$type<StoredUIMessage['role']>().notNull(),
  parts: text({ mode: 'json' }).$type<StoredUIMessage['parts']>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
})
