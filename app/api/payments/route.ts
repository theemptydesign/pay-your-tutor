import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tutorName, amount, paymentMonth } = body

    if (!userId || !tutorName || !amount || !paymentMonth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if payment already exists for this tutor and month
    const existingPayment = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.tutorName, tutorName),
          eq(payments.paymentMonth, paymentMonth)
        )
      )

    if (existingPayment.length > 0) {
      return NextResponse.json({ error: "Payment already recorded for this month" }, { status: 400 })
    }

    const [newPayment] = await db
      .insert(payments)
      .values({
        userId,
        tutorName,
        amount: amount.toString(),
        paymentMonth,
      })
      .returning()

    return NextResponse.json({ payment: newPayment }, { status: 201 })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const paymentMonth = searchParams.get("paymentMonth")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const conditions = [eq(payments.userId, userId)]
    if (paymentMonth) {
      conditions.push(eq(payments.paymentMonth, paymentMonth))
    }

    const allPayments = await db
      .select()
      .from(payments)
      .where(and(...conditions))

    return NextResponse.json({ payments: allPayments })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
