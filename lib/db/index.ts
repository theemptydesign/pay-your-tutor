import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/tutor_tracker"

// Create client lazily to avoid connection during build
let client: ReturnType<typeof postgres> | null = null

function getClient() {
  if (!client) {
    // Disable prefetch as it's not supported for "Transaction" pool mode
    client = postgres(connectionString, { prepare: false })
  }
  return client
}

export const db = drizzle(getClient(), { schema })
