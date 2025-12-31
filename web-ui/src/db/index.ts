import path from 'node:path'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'

import * as schema from './schema.ts'

// Use Electron's userData path in production, fallback to DATABASE_URL in development
const dbPath = process.env.ELECTRON_APP_PATH
  ? path.join(process.env.ELECTRON_APP_PATH, 'app.db')
  : process.env.DATABASE_URL || './app.db'

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
