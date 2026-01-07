import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestDbWithSchema } from '../../../../test/db/testDb.ts'
import * as schema from '../../../db/schema.ts'
import {
  createChat,
  insertMessages,
  loadChat,
  upsertMessage,
} from '../chatDao.ts'
import type { StoredUIMessage } from '../../message-types'

describe('chatDao', () => {
  let testDb: ReturnType<typeof createTestDbWithSchema>

  beforeEach(() => {
    // Create a fresh test database for each test
    testDb = createTestDbWithSchema()
  })

  afterEach(() => {
    testDb.close()
  })

  describe('createChat', () => {
    it('should create a new chat and return its ID', async () => {
      const chatId = await createChat(testDb.db)

      expect(chatId).toBeDefined()
      expect(typeof chatId).toBe('string')
      expect(chatId.length).toBeGreaterThan(0)

      // Verify the chat was created in the database
      const chats = await testDb.db.select().from(schema.chats)
      expect(chats).toHaveLength(1)
      expect(chats[0].id).toBe(chatId)
    })

    it('should create multiple chats with unique IDs', async () => {
      const chatId1 = await createChat(testDb.db)
      const chatId2 = await createChat(testDb.db)

      expect(chatId1).not.toBe(chatId2)

      const chats = await testDb.db.select().from(schema.chats)
      expect(chats).toHaveLength(2)
    })
  })

  describe('loadChat', () => {
    it('should return an empty array for a chat with no messages', async () => {
      const chatId = await createChat(testDb.db)
      const messages = await loadChat(chatId, testDb.db)

      expect(messages).toEqual([])
    })

    it('should load messages for a chat', async () => {
      const chatId = await createChat(testDb.db)

      // Insert test messages
      const testMessages: Array<StoredUIMessage> = [
        {
          id: 'msg-1',
          role: 'user' as const,
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          parts: [{ type: 'text', text: 'Hi there!' }],
        },
      ]

      await insertMessages({ chatId, messages: testMessages, db: testDb.db })

      const loadedMessages = await loadChat(chatId, testDb.db)

      expect(loadedMessages).toHaveLength(2)
      expect(loadedMessages[0].id).toBe('msg-1')
      expect(loadedMessages[0].role).toBe('user')
      expect(loadedMessages[0].parts).toEqual([{ type: 'text', text: 'Hello' }])
      expect(loadedMessages[1].id).toBe('msg-2')
      expect(loadedMessages[1].role).toBe('assistant')
      expect(loadedMessages[1].parts).toEqual([
        { type: 'text', text: 'Hi there!' },
      ])
    })

    it('should return messages ordered by creation time', async () => {
      const chatId = await createChat(testDb.db)

      // Insert messages directly into the database with controlled timestamps
      await testDb.db.insert(schema.messages).values([
        {
          id: 'msg-2',
          chatId,
          role: 'assistant',
          parts: [{ type: 'text', text: 'Second message' }],
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'msg-1',
          chatId,
          role: 'user',
          parts: [{ type: 'text', text: 'First message' }],
          createdAt: new Date('2024-01-01T09:00:00Z'),
        },
        {
          id: 'msg-3',
          chatId,
          role: 'user',
          parts: [{ type: 'text', text: 'Third message' }],
          createdAt: new Date('2024-01-01T11:00:00Z'),
        },
      ])

      const loadedMessages = await loadChat(chatId, testDb.db)

      // Should be ordered by createdAt timestamp
      expect(loadedMessages).toHaveLength(3)
      expect(loadedMessages[0].id).toBe('msg-1')
      expect(loadedMessages[1].id).toBe('msg-2')
      expect(loadedMessages[2].id).toBe('msg-3')
    })
  })

  describe('insertMessages', () => {
    it('should insert new messages without deleting existing ones', async () => {
      const chatId = await createChat(testDb.db)

      // Insert first message
      await insertMessages({
        chatId,
        messages: [
          {
            id: 'msg-1',
            role: 'user' as const,
            parts: [{ type: 'text', text: 'Hello' }],
          },
        ],
        db: testDb.db,
      })

      // Insert second message (should not delete the first)
      await insertMessages({
        chatId,
        messages: [
          {
            id: 'msg-2',
            role: 'assistant' as const,
            parts: [{ type: 'text', text: 'Hi there!' }],
          },
        ],
        db: testDb.db,
      })

      const loadedMessages = await loadChat(chatId, testDb.db)

      expect(loadedMessages).toHaveLength(2)
      expect(loadedMessages[0].id).toBe('msg-1')
      expect(loadedMessages[1].id).toBe('msg-2')
    })

    it('should handle empty message array', async () => {
      const chatId = await createChat(testDb.db)

      // Insert an existing message
      await insertMessages({
        chatId,
        messages: [
          {
            id: 'msg-1',
            role: 'user' as const,
            parts: [{ type: 'text', text: 'Hello' }],
          },
        ],
        db: testDb.db,
      })

      // Insert empty array (should do nothing)
      await insertMessages({ chatId, messages: [], db: testDb.db })

      const loadedMessages = await loadChat(chatId, testDb.db)
      expect(loadedMessages).toHaveLength(1)
    })

    it('should insert multiple messages at once', async () => {
      const chatId = await createChat(testDb.db)

      await insertMessages({
        chatId,
        messages: [
          {
            id: 'msg-1',
            role: 'user' as const,
            parts: [{ type: 'text', text: 'What is the weather?' }],
          },
          {
            id: 'msg-2',
            role: 'assistant' as const,
            parts: [{ type: 'text', text: "It's sunny!" }],
          },
        ],
        db: testDb.db,
      })

      const loadedMessages = await loadChat(chatId, testDb.db)

      expect(loadedMessages).toHaveLength(2)
      expect(loadedMessages[0].id).toBe('msg-1')
      expect(loadedMessages[1].id).toBe('msg-2')
    })
  })

  describe('integration tests', () => {
    it('should handle a complete chat flow', async () => {
      // Create a new chat
      const chatId = await createChat(testDb.db)

      // Add initial message
      await insertMessages({
        chatId,
        messages: [
          {
            id: 'msg-1',
            role: 'user' as const,
            parts: [{ type: 'text', text: 'What is the weather?' }],
          },
        ],
        db: testDb.db,
      })

      // Add response
      await insertMessages({
        chatId,
        messages: [
          {
            id: 'msg-2',
            role: 'assistant' as const,
            parts: [{ type: 'text', text: "It's sunny!" }],
          },
        ],
        db: testDb.db,
      })

      // Load and verify
      const messages = await loadChat(chatId, testDb.db)

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('user')
      expect(messages[1].role).toBe('assistant')
    })
  })

  describe('schema validation', () => {
    it('should reject messages with invalid role', async () => {
      const chatId = await createChat(testDb.db)

      const invalidMessage = {
        id: 'msg-1',
        role: 'invalid-role',
        parts: [{ type: 'text', text: 'Hello' }],
      }

      await expect(
        insertMessages({
          chatId,
          messages: [invalidMessage as unknown as StoredUIMessage],
          db: testDb.db,
        }),
      ).rejects.toThrow()

      const storedMessages = await testDb.db.select().from(schema.messages)
      expect(storedMessages).toHaveLength(0)
    })

    it('should reject messages with missing id', async () => {
      const chatId = await createChat(testDb.db)

      const invalidMessage = {
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      }

      await expect(
        insertMessages({
          chatId,
          messages: [invalidMessage as unknown as StoredUIMessage],
          db: testDb.db,
        }),
      ).rejects.toThrow()

      const storedMessages = await testDb.db.select().from(schema.messages)
      expect(storedMessages).toHaveLength(0)
    })

    it('should reject text parts with missing text field', async () => {
      const chatId = await createChat(testDb.db)

      const invalidMessage = {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text' }], // missing text field
      }

      await expect(
        insertMessages({
          chatId,
          messages: [invalidMessage as unknown as StoredUIMessage],
          db: testDb.db,
        }),
      ).rejects.toThrow()

      const storedMessages = await testDb.db.select().from(schema.messages)
      expect(storedMessages).toHaveLength(0)
    })

    it('should reject parts with unrecognized type prefix', async () => {
      const chatId = await createChat(testDb.db)

      const invalidMessage = {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'unknown-type', content: 'Hello' }],
      }

      await expect(
        insertMessages({
          chatId,
          messages: [invalidMessage as unknown as StoredUIMessage],
          db: testDb.db,
        }),
      ).rejects.toThrow()

      const storedMessages = await testDb.db.select().from(schema.messages)
      expect(storedMessages).toHaveLength(0)
    })

    it('should reject tool parts with missing required fields', async () => {
      const chatId = await createChat(testDb.db)

      const invalidMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-invocation',
            toolCallId: 'call-1',
            // missing toolName and state
          },
        ],
      }

      await expect(
        insertMessages({
          chatId,
          messages: [invalidMessage as unknown as StoredUIMessage],
          db: testDb.db,
        }),
      ).rejects.toThrow()

      const storedMessages = await testDb.db.select().from(schema.messages)
      expect(storedMessages).toHaveLength(0)
    })

    it('should accept valid tool parts', async () => {
      const chatId = await createChat(testDb.db)

      const validMessage: StoredUIMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-weather',
            toolCallId: 'call-1',
            state: 'output-available',
            input: { location: 'NYC' },
            output: { location: 'NYC', temperature: 72 },
          },
        ],
      }

      await insertMessages({
        chatId,
        messages: [validMessage],
        db: testDb.db,
      })

      const loaded = await loadChat(chatId, testDb.db)
      expect(loaded).toHaveLength(1)
      expect(loaded[0].parts[0].type).toBe('tool-weather')
    })

    it('should accept valid data parts', async () => {
      const chatId = await createChat(testDb.db)

      const validMessage: StoredUIMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [
          {
            type: 'data-weather',
            data: { loading: true, location: 'NYC' },
          },
        ],
      }

      await insertMessages({
        chatId,
        messages: [validMessage],
        db: testDb.db,
      })

      const loaded = await loadChat(chatId, testDb.db)
      expect(loaded).toHaveLength(1)
      expect(loaded[0].parts[0].type).toBe('data-weather')
    })

    it('should validate messages in upsertMessage', async () => {
      const chatId = 'chat-1'

      const invalidMessage = {
        id: 'msg-1',
        role: 'invalid-role',
        parts: [{ type: 'text', text: 'Hello' }],
      }

      expect(() =>
        upsertMessage({
          chatId,
          id: 'msg-1',
          message: invalidMessage as unknown as StoredUIMessage,
          db: testDb.db,
        }),
      ).toThrow()

      const storedMessages = await testDb.db.select().from(schema.messages)
      expect(storedMessages).toHaveLength(0)
    })
  })
})
