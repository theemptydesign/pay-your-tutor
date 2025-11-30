import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Lazy initialization to prevent connection during build
let _db: ReturnType<typeof drizzle> | null = null

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/tutor_tracker"
    // Disable prefetch as it's not supported for "Transaction" pool mode
    const client = postgres(connectionString, { prepare: false })
    _db = drizzle(client, { schema })
  }
  return _db
}

// Export a proxy that calls getDb() when accessed
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return (getDb() as any)[prop]
  }
})
