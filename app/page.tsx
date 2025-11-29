"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function HomePage() {
  const router = useRouter()
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [userName, setUserName] = useState("")
  const [showAddTutor, setShowAddTutor] = useState(false)
  const [tutorName, setTutorName] = useState("")
  const [tutorCost, setTutorCost] = useState("")
  const [error, setError] = useState<string | null>(null)

  const monthName = new Date().toLocaleString("default", { month: "long", year: "numeric" })

  const handleAddTutor = () => {
    setShowAddTutor(true)
  }

  const handleSaveTutor = async () => {
    if (!tutorName || !tutorCost) {
      setError("Name and cost are required")
      return
    }

    // Show name dialog after first tutor is added
    setShowAddTutor(false)
    setShowNameDialog(true)
  }

  const handleSaveName = async () => {
    if (!userName) {
      setError("Please enter your name")
      return
    }

    try {
      // Create the tutor with the user's name
      const response = await fetch("/api/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userName.toLowerCase(),
          name: tutorName,
          defaultCost: parseFloat(tutorCost),
        }),
      })

      if (!response.ok) throw new Error("Failed to create tutor")

      // Redirect to their personalized page
      router.push(`/${userName.toLowerCase()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    }
  }

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">Add Visit</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddTutor}
              className="m3-button rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              + Add Your First Tutor
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
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                    No tutors yet. Add your first tutor to get started!
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline bg-secondary/30">
                  <td colSpan={3} className="px-4 py-4 text-sm font-medium text-foreground">
                    Grand Total
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-foreground">$0.00</td>
                  <td className="px-4 py-4 text-right text-lg font-semibold text-primary">$0.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-on-surface-variant">
          Monthly visits are calculated for the current month. YTD resets each January.
        </p>
      </div>

      {/* Add Tutor Dialog */}
      <Dialog open={showAddTutor} onOpenChange={setShowAddTutor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Your First Tutor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="tutor-name">Tutor Name</Label>
              <Input
                id="tutor-name"
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                className="mt-2"
                placeholder="Enter tutor name"
              />
            </div>
            <div>
              <Label htmlFor="tutor-cost">Cost per Visit ($)</Label>
              <Input
                id="tutor-cost"
                type="number"
                step="0.01"
                value={tutorCost}
                onChange={(e) => setTutorCost(e.target.value)}
                className="mt-2"
                placeholder="0.00"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSaveTutor} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What's your name?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-on-surface-variant">
              This will be used to create your personalized tracker URL.
            </p>
            <div>
              <Label htmlFor="user-name">Your Name</Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-2"
                placeholder="e.g., Monica"
              />
            </div>
            {userName && (
              <p className="text-sm text-on-surface-variant">
                Your tracker will be available at: <code className="text-primary">/{userName.toLowerCase()}</code>
              </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSaveName} className="w-full">
              Create My Tracker
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
