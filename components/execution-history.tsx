"use client"

import { useState, useEffect } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"

export function ExecutionHistory() {
  const { modelGroups } = useModelState()
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState("all") // all, completed, error

  // Build and update execution history
  useEffect(() => {
    const newHistory = []

    modelGroups.forEach((model) => {
      if (model.status === "completed" && model.startTime && model.endTime) {
        newHistory.push({
          id: `${model.id}-${model.endTime}`,
          type: "model",
          name: model.name,
          status: "completed",
          timestamp: model.endTime,
          duration: (model.endTime - model.startTime) / 1000,
        })
      }

      // Add module history
      model.modules?.forEach((module) => {
        if (module.status === "completed") {
          newHistory.push({
            id: `${module.id}-${Date.now()}`, // Using current time as a fallback
            type: "module",
            name: module.name,
            modelName: model.name,
            status: "completed",
            timestamp: Date.now(), // Should ideally use module's endTime
            duration: 1.5, // Should ideally calculate from module's startTime and endTime
          })
        }
      })
    })

    // Sort by timestamp (newest first)
    newHistory.sort((a, b) => b.timestamp - a.timestamp)

    // Only keep the most recent 20 items
    setHistory(newHistory.slice(0, 20))
  }, [modelGroups])

  // Filter history based on selected filter
  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true
    return item.status === filter
  })

  if (history.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution History</CardTitle>
        <CardDescription>Recent model and module executions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium">
                  {item.name}
                  {item.type === "module" && (
                    <span className="text-muted-foreground text-xs ml-2">in {item.modelName}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString()} • {item.duration.toFixed(1)}s
                </div>
              </div>
              <Badge
                className={
                  item.status === "completed" ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"
                }
              >
                {item.status === "completed" ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" /> Completed
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" /> Error
                  </>
                )}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
