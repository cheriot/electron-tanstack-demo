import { os } from '@orpc/server'
import * as z from 'zod'
import { LoadChatInputSchema } from '../schema'
import {
  createChat as createChatDao,
  loadChat as loadChatDao,
} from '@/lib/dao/chatDao'
import { db } from '@/db'
import { StoredMessageSchema } from '@/lib/message-schema'

// Use Zod schema for oRPC output to maintain framework type compatibility.
// Cast to StoredUIMessage at the useChat boundary for ai-sdk compatibility.
export const loadChat = os
  .input(LoadChatInputSchema)
  .output(z.array(StoredMessageSchema))
  .handler(async ({ input }) => {
    // loadChatDao returns StoredUIMessage[], cast back to ChatMessage[] for oRPC
    return (await loadChatDao(input.id, db)) as Array<
      z.infer<typeof StoredMessageSchema>
    >
  })

export const createChat = os.input(z.object({})).handler(async () => {
  return await createChatDao(db)
})
