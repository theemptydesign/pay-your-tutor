import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tutors, visits } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const allTutors = await db
      .select()
      .from(tutors)
      .where(and(eq(tutors.userId, userId), eq(tutors.isActive, true)))
    return NextResponse.json({ tutors: allTutors })
  } catch (error) {
    console.error("Error fetching tutors:", error)
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id, name, defaultCost } = body

    if (!userId || !id || !name || !defaultCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [updatedTutor] = await db
      .update(tutors)
      .set({
        name,
        defaultCost: defaultCost.toString(),
        updatedAt: new Date(),
      })
      .where(and(eq(tutors.id, id), eq(tutors.userId, userId)))
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
    const { userId, name, defaultCost } = body

    if (!userId || !name || !defaultCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [newTutor] = await db
      .insert(tutors)
      .values({
        userId,
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, id } = body

    if (!userId || !id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the tutor name first
    const [tutor] = await db.select().from(tutors).where(and(eq(tutors.id, id), eq(tutors.userId, userId)))

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 })
    }

    // Delete all visits for this tutor and user
    await db.delete(visits).where(and(eq(visits.tutorName, tutor.name), eq(visits.userId, userId)))

    // Soft delete the tutor by setting isActive to false
    await db
      .update(tutors)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(tutors.id, id), eq(tutors.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tutor:", error)
    return NextResponse.json({ error: "Failed to delete tutor" }, { status: 500 })
  }
}
