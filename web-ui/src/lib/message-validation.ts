import { safeValidateUIMessages } from 'ai'
import { WEATHER_TOOLS } from './agents/weather-agent'
import { AppDataSchemas, MessageMetadataSchema } from './message-types'
import type { SafeValidateUIMessagesResult } from 'ai'
import type { StoredUIMessage } from './message-types'
import type { MessageRow, NewMessageRow } from '@/db/row-types'

export const safeValidate = (
  stored: Array<StoredUIMessage>,
): Promise<SafeValidateUIMessagesResult<StoredUIMessage>> => {
  return safeValidateUIMessages<StoredUIMessage>({
    messages: stored,
    metadataSchema: MessageMetadataSchema,
    dataSchemas: AppDataSchemas,
    tools: WEATHER_TOOLS,
  })
}

export const rowToStoredUIMessage = (row: MessageRow): StoredUIMessage => {
  return {
    id: row.id,
    role: row.role,
    parts: row.parts,
  }
}

export const storedUIMessageToRow = (
  message: StoredUIMessage,
  chatId: string,
): NewMessageRow => {
  return {
    id: message.id || undefined, // Let schema $defaultFn generate if empty
    chatId,
    role: message.role,
    parts: message.parts,
  }
}
