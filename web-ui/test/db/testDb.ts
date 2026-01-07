import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../../src/db/schema.ts'

/**
 * Create an in-memory SQLite database for testing with schema applied via pushSchema.
 * Uses drizzle-kit's pushSchema to directly create tables from the schema definition,
 * ensuring the test database schema stays in sync with the code.
 */
export function createTestDbWithSchema() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })

  // Push schema directly to the in-memory database
  migrate(db, { migrationsFolder: './drizzle' })

  return {
    db,
    sqlite,
    /**
     * Close the database connection
     */
    close: () => sqlite.close(),
  }
}
