import { pgTable, serial, varchar, decimal, timestamp, boolean } from "drizzle-orm/pg-core"

export const tutors = pgTable("tutors", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  defaultCost: decimal("default_cost", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  tutorName: varchar("tutor_name", { length: 50 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  visitDate: timestamp("visit_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  tutorName: varchar("tutor_name", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMonth: varchar("payment_month", { length: 7 }).notNull(), // Format: "2025-01"
  paymentDate: timestamp("payment_date").notNull(), // When the checkbox was clicked
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Tutor = typeof tutors.$inferSelect
export type NewTutor = typeof tutors.$inferInsert
export type Visit = typeof visits.$inferSelect
export type NewVisit = typeof visits.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
