import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { visits } from "@/lib/db/schema"
import { sql, and, gte } from "drizzle-orm"

export async function GET() {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Start of current month
    const monthStart = new Date(currentYear, currentMonth, 1)

    // Start of current year
    const yearStart = new Date(currentYear, 0, 1)

    // Get monthly visits grouped by tutor
    const monthlyResults = await db
      .select({
        tutorName: visits.tutorName,
        count: sql<number>`count(*)::int`,
        total: sql<number>`sum(${visits.cost})::numeric`,
      })
      .from(visits)
      .where(gte(visits.visitDate, monthStart))
      .groupBy(visits.tutorName)

    // Get YTD visits grouped by tutor
    const ytdResults = await db
      .select({
        tutorName: visits.tutorName,
        count: sql<number>`count(*)::int`,
        total: sql<number>`sum(${visits.cost})::numeric`,
      })
      .from(visits)
      .where(gte(visits.visitDate, yearStart))
      .groupBy(visits.tutorName)

    // Format results
    const monthlyVisits: Record<string, { count: number; total: number }> = {}
    const ytdVisits: Record<string, { count: number; total: number }> = {}

    monthlyResults.forEach((row) => {
      monthlyVisits[row.tutorName] = {
        count: row.count,
        total: parseFloat(row.total.toString()),
      }
    })

    ytdResults.forEach((row) => {
      ytdVisits[row.tutorName] = {
        count: row.count,
        total: parseFloat(row.total.toString()),
      }
    })

    return NextResponse.json({
      monthly: monthlyVisits,
      ytd: ytdVisits,
      currentMonth,
      currentYear,
    })
  } catch (error) {
    console.error("Error fetching summary:", error)
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 })
  }
}
