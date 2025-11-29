"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Tutor = {
  id: number
  name: string
  defaultCost: string
  isActive: boolean
}

type VisitSummary = Record<string, { count: number; total: number }>

export default function VisitTracker() {
  const params = useParams()
  const userId = params.userId as string
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [currentMonthVisits, setCurrentMonthVisits] = useState<VisitSummary>({})
  const [previousMonthVisits, setPreviousMonthVisits] = useState<VisitSummary>({})
  const [ytdVisits, setYtdVisits] = useState<VisitSummary>({})
  const [paidTutors, setPaidTutors] = useState<Record<string, boolean>>({})
  const [previousMonthString, setPreviousMonthString] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null)
  const [editName, setEditName] = useState("")
  const [editCost, setEditCost] = useState("")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)

  const fetchTutors = async () => {
    try {
      const response = await fetch(`/api/tutors?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch tutors")
      const data = await response.json()
      setTutors(data.tutors)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/visits/summary?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch summary")
      const data = await response.json()
      setCurrentMonthVisits(data.currentMonth)
      setPreviousMonthVisits(data.previousMonth)
      setYtdVisits(data.ytd)
      setPaidTutors(data.paidTutors || {})
      setPreviousMonthString(data.previousMonthString || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  useEffect(() => {
    Promise.all([fetchTutors(), fetchSummary()]).finally(() => setLoading(false))
  }, [userId])

  const addVisit = async (tutorName: string, cost: string) => {
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tutorName,
          cost: parseFloat(cost),
        }),
      })

      if (!response.ok) throw new Error("Failed to add visit")
      await fetchSummary()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add visit")
    }
  }

  const openEditDialog = (tutor: Tutor) => {
    setEditingTutor(tutor)
    setEditName(tutor.name)
    setEditCost(tutor.defaultCost)
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editName || !editCost) {
      setError("Name and cost are required")
      return
    }

    try {
      if (isAddingNew) {
        // Create new tutor
        const response = await fetch("/api/tutors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: editName,
            defaultCost: parseFloat(editCost),
          }),
        })

        if (!response.ok) throw new Error("Failed to create tutor")
      } else {
        // Update existing tutor
        if (!editingTutor) return

        const response = await fetch("/api/tutors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            id: editingTutor.id,
            name: editName,
            defaultCost: parseFloat(editCost),
          }),
        })

        if (!response.ok) throw new Error("Failed to update tutor")
      }

      await fetchTutors()
      await fetchSummary()
      setIsEditOpen(false)
      setEditingTutor(null)
      setIsAddingNew(false)
      setEditName("")
      setEditCost("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tutor")
    }
  }

  const handleDeleteTutor = async () => {
    if (!editingTutor) return

    if (!confirm(`Are you sure you want to delete ${editingTutor.name}? This will also delete all visit records for this tutor.`)) {
      return
    }

    try {
      const response = await fetch("/api/tutors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          id: editingTutor.id,
        }),
      })

      if (!response.ok) throw new Error("Failed to delete tutor")

      await fetchTutors()
      await fetchSummary()
      setIsEditOpen(false)
      setEditingTutor(null)
      setEditName("")
      setEditCost("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tutor")
    }
  }

  const markAsPaid = async (tutorName: string, amount: number) => {
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tutorName,
          amount,
          paymentMonth: previousMonthString,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to mark as paid")
      }

      await fetchSummary()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as paid")
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

  const currentMonthTotal = Object.values(currentMonthVisits).reduce((sum, v) => sum + v.total, 0)
  const previousMonthTotal = Object.values(previousMonthVisits).reduce((sum, v) => sum + v.total, 0)
  const ytdTotal = Object.values(ytdVisits).reduce((sum, v) => sum + v.total, 0)

  const now = new Date()
  const currentMonthName = now.toLocaleString("default", { month: "long", year: "numeric" })
  const previousMonthName = new Date(now.getFullYear(), now.getMonth() - 1).toLocaleString("default", {
    month: "long",
    year: "numeric"
  })

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Visit Tracker</h1>
          <p className="mt-2 text-on-surface-variant">{currentMonthName}</p>
        </header>

        {/* Buttons Card */}
        <div className="mb-6 rounded-3xl bg-surface-container p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">Add Visit</h2>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit Tutors</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Tutor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="tutor-select">Select Tutor</Label>
                    <select
                      id="tutor-select"
                      className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
                      value={isAddingNew ? "new" : (editingTutor?.id || "")}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setIsAddingNew(true)
                          setEditingTutor(null)
                          setEditName("")
                          setEditCost("")
                        } else {
                          const tutor = tutors.find((t) => t.id === parseInt(e.target.value))
                          if (tutor) {
                            setIsAddingNew(false)
                            setEditingTutor(tutor)
                            setEditName(tutor.name)
                            setEditCost(tutor.defaultCost)
                          }
                        }
                      }}
                    >
                      <option value="">-- Select a tutor --</option>
                      <option value="new">+ Add New Tutor</option>
                      {tutors.map((tutor) => {
                        // Show Miss Ford twice in the dropdown
                        if (tutor.name === "Miss Ford") {
                          return (
                            <>
                              <option key={`${tutor.id}-wyatt`} value={tutor.id}>
                                Miss Ford - Wyatt
                              </option>
                              <option key={`${tutor.id}-gabriel`} value={tutor.id}>
                                Miss Ford - Gabriel
                              </option>
                            </>
                          )
                        }
                        return (
                          <option key={tutor.id} value={tutor.id}>
                            {tutor.name}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {(editingTutor || isAddingNew) && (
                    <>
                      <div>
                        <Label htmlFor="tutor-name">Name</Label>
                        <Input
                          id="tutor-name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-2"
                          placeholder="Enter tutor name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tutor-cost">Default Cost ($)</Label>
                        <Input
                          id="tutor-cost"
                          type="number"
                          step="0.01"
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                          className="mt-2"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} className="flex-1">
                          {isAddingNew ? "Add Tutor" : "Save Changes"}
                        </Button>
                        {!isAddingNew && editingTutor && (
                          <Button onClick={handleDeleteTutor} variant="destructive">
                            Delete
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tutors.flatMap((tutor) => {
              // Handle Miss Ford separately - show two buttons
              if (tutor.name === "Miss Ford") {
                return [
                  <button
                    key={`${tutor.id}-wyatt`}
                    onClick={() => addVisit(tutor.name, tutor.defaultCost)}
                    className="m3-button rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-md transition-shadow hover:shadow-lg"
                  >
                    Miss Ford - Wyatt
                  </button>,
                  <button
                    key={`${tutor.id}-gabriel`}
                    onClick={() => addVisit(tutor.name, tutor.defaultCost)}
                    className="m3-button rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-md transition-shadow hover:shadow-lg"
                  >
                    Miss Ford - Gabriel
                  </button>
                ]
              }

              return [
                <button
                  key={tutor.id}
                  onClick={() => addVisit(tutor.name, tutor.defaultCost)}
                  className="m3-button rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
                >
                  {tutor.name}
                </button>
              ]
            })}
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
                  <th className="px-4 py-3 text-right text-sm font-medium text-on-surface-variant">YTD Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-on-surface-variant">Previous Month</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-on-surface-variant">Current Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {tutors.map((tutor) => {
                  const current = currentMonthVisits[tutor.name] || { count: 0, total: 0 }
                  const previous = previousMonthVisits[tutor.name] || { count: 0, total: 0 }
                  const ytd = ytdVisits[tutor.name] || { count: 0, total: 0 }

                  const isPaid = paidTutors[tutor.name] || false
                  const hasPreviousAmount = previous.total > 0

                  return (
                    <tr key={tutor.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-foreground">{tutor.name}</td>
                      <td className="px-4 py-4 text-center text-sm text-foreground">{current.count}</td>
                      <td className="px-4 py-4 text-center text-sm text-on-surface-variant">
                        ${parseFloat(tutor.defaultCost).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                        ${ytd.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-sm font-medium ${isPaid ? "text-green-600 dark:text-green-400" : "text-on-surface-variant"}`}>
                            ${previous.total.toFixed(2)}
                          </span>
                          {hasPreviousAmount && !isPaid && (
                            <button
                              onClick={() => markAsPaid(tutor.name, previous.total)}
                              className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                              title="Mark as paid"
                            >
                              Mark Paid
                            </button>
                          )}
                          {isPaid && (
                            <span className="text-xs text-green-600 dark:text-green-400">✓ Paid</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                        ${current.total.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline bg-secondary/30">
                  <td colSpan={3} className="px-4 py-4 text-sm font-medium text-foreground">
                    Grand Total
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-primary">${ytdTotal.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-on-surface-variant">
                    ${previousMonthTotal.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-foreground">
                    ${currentMonthTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-on-surface-variant">
          Current month shows visits for {currentMonthName.split(" ")[0]}. Previous month shows {previousMonthName.split(" ")[0]}. YTD resets each January.
        </p>
      </div>
    </main>
  )
}
