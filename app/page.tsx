"use client"

import { useState, useEffect } from "react"

type VisitData = {
  neill: { count: number; total: number }
  will: { count: number; total: number }
  missFord: { count: number; total: number }
}

const COSTS = {
  neill: 90,
  will: 68,
  missFord: 75,
}

const TUTOR_NAMES = {
  neill: "Neill",
  will: "Will",
  missFord: "Miss Ford",
}

export default function VisitTracker() {
  const [monthlyVisits, setMonthlyVisits] = useState<VisitData | null>(null)
  const [ytdVisits, setYtdVisits] = useState<VisitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/visits/summary")
      if (!response.ok) throw new Error("Failed to fetch summary")

      const data = await response.json()

      // Transform API response to match our VisitData type
      const transformData = (apiData: Record<string, { count: number; total: number }>) => ({
        neill: apiData[TUTOR_NAMES.neill] || { count: 0, total: 0 },
        will: apiData[TUTOR_NAMES.will] || { count: 0, total: 0 },
        missFord: apiData[TUTOR_NAMES.missFord] || { count: 0, total: 0 },
      })

      setMonthlyVisits(transformData(data.monthly))
      setYtdVisits(transformData(data.ytd))
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const addVisit = async (tutorKey: keyof typeof TUTOR_NAMES) => {
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorName: TUTOR_NAMES[tutorKey],
          cost: COSTS[tutorKey],
        }),
      })

      if (!response.ok) throw new Error("Failed to add visit")

      // Refresh the summary
      await fetchSummary()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add visit")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  if (!monthlyVisits || !ytdVisits) {
    return null
  }

  const monthlyTotal =
    monthlyVisits.neill.total + monthlyVisits.will.total + monthlyVisits.missFord.total
  const ytdTotal = ytdVisits.neill.total + ytdVisits.will.total + ytdVisits.missFord.total

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
              onClick={() => addVisit("neill")}
              className="m3-button rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Neill
            </button>
            <button
              onClick={() => addVisit("will")}
              className="m3-button rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Will
            </button>
            <button
              onClick={() => addVisit("missFord")}
              className="m3-button rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Miss Ford - Wyatt
            </button>
            <button
              onClick={() => addVisit("missFord")}
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
                  <td className="px-4 py-4 text-center text-sm text-foreground">{monthlyVisits.neill.count}</td>
                  <td className="px-4 py-4 text-center text-sm text-on-surface-variant">${COSTS.neill}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                    ${monthlyVisits.neill.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                    ${ytdVisits.neill.total.toFixed(2)}
                  </td>
                </tr>
                <tr className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-foreground">Will</td>
                  <td className="px-4 py-4 text-center text-sm text-foreground">{monthlyVisits.will.count}</td>
                  <td className="px-4 py-4 text-center text-sm text-on-surface-variant">${COSTS.will}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                    ${monthlyVisits.will.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                    ${ytdVisits.will.total.toFixed(2)}
                  </td>
                </tr>
                <tr className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-foreground">Miss Ford</td>
                  <td className="px-4 py-4 text-center text-sm text-foreground">{monthlyVisits.missFord.count}</td>
                  <td className="px-4 py-4 text-center text-sm text-on-surface-variant">${COSTS.missFord}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                    ${monthlyVisits.missFord.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                    ${ytdVisits.missFord.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline bg-secondary/30">
                  <td colSpan={3} className="px-4 py-4 text-sm font-medium text-foreground">
                    Grand Total
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-foreground">${monthlyTotal.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-primary">${ytdTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-on-surface-variant">
          Monthly visits are calculated for the current month. YTD resets each January.
        </p>
      </div>
    </main>
  )
}
