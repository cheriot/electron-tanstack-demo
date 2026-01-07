import { os } from '@orpc/server'
import * as z from 'zod'
import { AddTodoInputSchema } from '../schema'
import type { Todo, TodoList } from '../schema'

const todos: TodoList = [
  { id: 1, name: 'Get groceries' },
  { id: 2, name: 'Buy a new phone' },
  { id: 3, name: 'Finish the project' },
]

export const listTodos = os.input(z.object({})).handler((): TodoList => {
  return todos
})

export const addTodo = os
  .input(AddTodoInputSchema)
  .handler(({ input }): Todo => {
    const newTodo = { id: todos.length + 1, name: input.name }
    todos.push(newTodo)
    return newTodo
  })
