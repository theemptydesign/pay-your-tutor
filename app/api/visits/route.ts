import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { visits } from "@/lib/db/schema"
import { desc, and, gte, lte, eq, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const conditions = [eq(visits.userId, userId)]

    // Filter by year and/or month if provided
    if (year || month) {
      const currentYear = year ? parseInt(year) : new Date().getFullYear()
      const currentMonth = month ? parseInt(month) : new Date().getMonth()

      const startDate = new Date(currentYear, currentMonth, 1)
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

      conditions.push(gte(visits.visitDate, startDate))
      conditions.push(lte(visits.visitDate, endDate))
    }

    const allVisits = await db
      .select()
      .from(visits)
      .where(and(...conditions))
      .orderBy(desc(visits.visitDate))

    return NextResponse.json({ visits: allVisits })
  } catch (error) {
    console.error("Error fetching visits:", error)
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tutorName, cost } = body

    if (!userId || !tutorName || !cost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [newVisit] = await db
      .insert(visits)
      .values({
        userId,
        tutorName,
        cost: cost.toString(),
      })
      .returning()

    return NextResponse.json({ visit: newVisit }, { status: 201 })
  } catch (error) {
    console.error("Error creating visit:", error)
    return NextResponse.json({ error: "Failed to create visit" }, { status: 500 })
  }
}
