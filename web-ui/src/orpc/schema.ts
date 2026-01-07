import { z } from 'zod'

export const TodoSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
})
export type Todo = z.infer<typeof TodoSchema>

export const AddTodoInputSchema = TodoSchema.omit({ id: true })
export type AddTodoInput = z.infer<typeof AddTodoInputSchema>

export const TodoListSchema = z.array(TodoSchema)
export type TodoList = z.infer<typeof TodoListSchema>

export const TodoListInputSchema = z.object()

// Chat schemas
export const LoadChatInputSchema = z.object({
  id: z.string(),
})
export type LoadChatInput = z.infer<typeof LoadChatInputSchema>
