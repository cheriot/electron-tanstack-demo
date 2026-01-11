import { os } from '@orpc/server'
import * as z from 'zod'
import { LoadChatInputSchema } from '../schema'
import type { StoredUIMessage } from '@/lib/message-types'
import {
  createChat as createChatDao,
  loadChat as loadChatDao,
} from '@/lib/dao/chatDao'
import { db } from '@/db'

export const loadChat = os
  .input(LoadChatInputSchema)
  .handler(async ({ input }): Promise<Array<StoredUIMessage>> => {
    return loadChatDao(input.id, db)
  })

export const createChat = os.input(z.object({})).handler(async () => {
  return await createChatDao(db)
})
