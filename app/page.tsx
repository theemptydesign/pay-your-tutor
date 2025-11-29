"use client"

import { useState, useEffect } from "react"

type VisitData = {
  neill: number
  will: number
  missFord: number
}

type StoredData = {
  currentMonth: number
  currentYear: number
  monthlyVisits: VisitData
  ytdVisits: VisitData
}

const COSTS = {
  neill: 90,
  will: 68,
  missFord: 75,
}

const STORAGE_KEY = "visit-tracker-data"

function getInitialData(): StoredData {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  if (typeof window === "undefined") {
    return {
      currentMonth,
      currentYear,
      monthlyVisits: { neill: 0, will: 0, missFord: 0 },
      ytdVisits: { neill: 0, will: 0, missFord: 0 },
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return {
      currentMonth,
      currentYear,
      monthlyVisits: { neill: 0, will: 0, missFord: 0 },
      ytdVisits: { neill: 0, will: 0, missFord: 0 },
    }
  }

  const data: StoredData = JSON.parse(stored)

  // Reset YTD if new year
  if (data.currentYear !== currentYear) {
    return {
      currentMonth,
      currentYear,
      monthlyVisits: { neill: 0, will: 0, missFord: 0 },
      ytdVisits: { neill: 0, will: 0, missFord: 0 },
    }
  }

  // Reset monthly visits if new month (but keep YTD)
  if (data.currentMonth !== currentMonth) {
    return {
      currentMonth,
      currentYear,
      monthlyVisits: { neill: 0, will: 0, missFord: 0 },
      ytdVisits: data.ytdVisits,
    }
  }

  return data
}

export default function VisitTracker() {
  const [data, setData] = useState<StoredData | null>(null)

  useEffect(() => {
    setData(getInitialData())
  }, [])

  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  const incrementVisit = (person: keyof VisitData) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        monthlyVisits: {
          ...prev.monthlyVisits,
          [person]: prev.monthlyVisits[person] + 1,
        },
        ytdVisits: {
          ...prev.ytdVisits,
          [person]: prev.ytdVisits[person] + 1,
        },
      }
    })
  }

  // Show loading state while hydrating
  if (!data) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </main>
    )
  }

  const { monthlyVisits, ytdVisits } = data
  const monthlyTotal =
    monthlyVisits.neill * COSTS.neill + monthlyVisits.will * COSTS.will + monthlyVisits.missFord * COSTS.missFord
  const ytdTotal = ytdVisits.neill * COSTS.neill + ytdVisits.will * COSTS.will + ytdVisits.missFord * COSTS.missFord

  const monthName = new Date().toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Visit Tracker</h1>
          <p className="mt-2 text-on-surface-variant">{monthName}</p>
        </header>

        {/* Buttons Card */}
        <div className="mb-6 rounded-3xl bg-surface-container p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-on-surface-variant">Add Visit</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => incrementVisit("neill")}
              className="m3-button rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Neill
            </button>
            <button
              onClick={() => incrementVisit("will")}
              className="m3-button rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Will
            </button>
            <button
              onClick={() => incrementVisit("missFord")}
              className="m3-button rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Miss Ford - Wyatt
            </button>
            <button
              onClick={() => incrementVisit("missFord")}
              className="m3-button rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Miss Ford - Gabriel
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-3xl bg-surface-container-high shadow-sm">
          <div className="p-6 pb-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">Visit Summary</h2>
          </div>
          <div className="overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant">Name</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-on-surface-variant">Visits</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-on-surface-variant">Cost</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-on-surface-variant">Monthly Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-on-surface-variant">YTD Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-foreground">Neill</td>
                  <td className="px-4 py-4 text-center text-sm text-foreground">{monthlyVisits.neill}</td>
                  <td className="px-4 py-4 text-center text-sm text-on-surface-variant">${COSTS.neill}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                    ${monthlyVisits.neill * COSTS.neill}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                    ${ytdVisits.neill * COSTS.neill}
                  </td>
                </tr>
                <tr className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-foreground">Will</td>
                  <td className="px-4 py-4 text-center text-sm text-foreground">{monthlyVisits.will}</td>
                  <td className="px-4 py-4 text-center text-sm text-on-surface-variant">${COSTS.will}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                    ${monthlyVisits.will * COSTS.will}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                    ${ytdVisits.will * COSTS.will}
                  </td>
                </tr>
                <tr className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-foreground">Miss Ford</td>
                  <td className="px-4 py-4 text-center text-sm text-foreground">{monthlyVisits.missFord}</td>
                  <td className="px-4 py-4 text-center text-sm text-on-surface-variant">${COSTS.missFord}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                    ${monthlyVisits.missFord * COSTS.missFord}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                    ${ytdVisits.missFord * COSTS.missFord}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline bg-secondary/30">
                  <td colSpan={3} className="px-4 py-4 text-sm font-medium text-foreground">
                    Grand Total
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-foreground">${monthlyTotal}</td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-primary">${ytdTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-on-surface-variant">
          Monthly visits reset automatically at the start of each month. YTD resets each January.
        </p>
      </div>
    </main>
  )
}
