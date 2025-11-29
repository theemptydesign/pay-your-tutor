import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tutors } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const allTutors = await db.select().from(tutors).where(eq(tutors.isActive, true))
    return NextResponse.json({ tutors: allTutors })
  } catch (error) {
    console.error("Error fetching tutors:", error)
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, defaultCost } = body

    if (!id || !name || !defaultCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [updatedTutor] = await db
      .update(tutors)
      .set({
        name,
        defaultCost: defaultCost.toString(),
        updatedAt: new Date(),
      })
      .where(eq(tutors.id, id))
      .returning()

    return NextResponse.json({ tutor: updatedTutor })
  } catch (error) {
    console.error("Error updating tutor:", error)
    return NextResponse.json({ error: "Failed to update tutor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, defaultCost } = body

    if (!name || !defaultCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [newTutor] = await db
      .insert(tutors)
      .values({
        name,
        defaultCost: defaultCost.toString(),
      })
      .returning()

    return NextResponse.json({ tutor: newTutor }, { status: 201 })
  } catch (error) {
    console.error("Error creating tutor:", error)
    return NextResponse.json({ error: "Failed to create tutor" }, { status: 500 })
  }
}
