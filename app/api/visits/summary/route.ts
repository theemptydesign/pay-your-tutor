import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { visits, payments } from "@/lib/db/schema"
import { sql, and, gte, lte, eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Start of current month
    const currentMonthStart = new Date(currentYear, currentMonth, 1)

    // Start and end of previous month
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    // Start of current year
    const yearStart = new Date(currentYear, 0, 1)

    // Get current month visits grouped by tutor
    const currentMonthResults = await db
      .select({
        tutorName: visits.tutorName,
        count: sql<number>`count(*)::int`,
        total: sql<number>`sum(${visits.cost})::numeric`,
      })
      .from(visits)
      .where(and(eq(visits.userId, userId), gte(visits.visitDate, currentMonthStart)))
      .groupBy(visits.tutorName)

    // Get previous month visits grouped by tutor
    const previousMonthResults = await db
      .select({
        tutorName: visits.tutorName,
        count: sql<number>`count(*)::int`,
        total: sql<number>`sum(${visits.cost})::numeric`,
      })
      .from(visits)
      .where(
        and(
          eq(visits.userId, userId),
          gte(visits.visitDate, prevMonthStart),
          lte(visits.visitDate, prevMonthEnd)
        )
      )
      .groupBy(visits.tutorName)

    // Get YTD visits grouped by tutor
    const ytdResults = await db
      .select({
        tutorName: visits.tutorName,
        count: sql<number>`count(*)::int`,
        total: sql<number>`sum(${visits.cost})::numeric`,
      })
      .from(visits)
      .where(and(eq(visits.userId, userId), gte(visits.visitDate, yearStart)))
      .groupBy(visits.tutorName)

    // Format results
    const currentMonthVisits: Record<string, { count: number; total: number }> = {}
    const previousMonthVisits: Record<string, { count: number; total: number }> = {}
    const ytdVisits: Record<string, { count: number; total: number }> = {}

    currentMonthResults.forEach((row) => {
      currentMonthVisits[row.tutorName] = {
        count: row.count,
        total: parseFloat(row.total.toString()),
      }
    })

    previousMonthResults.forEach((row) => {
      previousMonthVisits[row.tutorName] = {
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

    // Get payment status for previous month
    const prevMonthString = `${currentYear}-${String(currentMonth).padStart(2, "0")}`
    const paymentRecords = await db
      .select()
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.paymentMonth, prevMonthString)))

    const paidTutors: Record<string, boolean> = {}
    paymentRecords.forEach((payment) => {
      paidTutors[payment.tutorName] = true
    })

    return NextResponse.json({
      currentMonth: currentMonthVisits,
      previousMonth: previousMonthVisits,
      ytd: ytdVisits,
      paidTutors,
      currentMonthNumber: currentMonth,
      currentYear,
      previousMonthString: prevMonthString,
    })
  } catch (error) {
    console.error("Error fetching summary:", error)
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 })
  }
}
