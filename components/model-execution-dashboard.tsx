"use client"

import { useModelState } from "@/context/model-state-context"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Clock, CheckCircle, AlertCircle, Snowflake } from "lucide-react"

export function ModelExecutionDashboard() {
  const { modelGroups, getExecutionSequence, getFrozenModels } = useModelState()

  // Get models by status
  const sequence = getExecutionSequence()
  const runningModels = sequence.filter((model) => model.status === "running")
  const pendingModels = sequence.filter((model) => model.status === "idle" || model.status === "blocked")
  const completedModels = sequence.filter((model) => model.status === "completed")
  const failedModels = sequence.filter((model) => model.status === "failed" || model.status === "error")
  const frozenModels = getFrozenModels ? getFrozenModels() : []

  // Calculate percentages
  const totalModels = sequence.length
  const completedPercentage = totalModels > 0 ? Math.round((completedModels.length / totalModels) * 100) : 0
  const runningPercentage = totalModels > 0 ? Math.round((runningModels.length / totalModels) * 100) : 0
  const pendingPercentage = totalModels > 0 ? Math.round((pendingModels.length / totalModels) * 100) : 0
  const failedPercentage = totalModels > 0 ? Math.round((failedModels.length / totalModels) * 100) : 0
  const frozenPercentage = totalModels > 0 ? Math.round((frozenModels.length / totalModels) * 100) : 0

  return (
    <div className="grid grid-cols-5 gap-4">
      <Card className={`${runningModels.length > 0 ? "border-blue-300 bg-blue-50" : ""}`}>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mb-2">
            <Play className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-blue-600 text-2xl font-bold">{runningModels.length}</div>
          <div className="text-sm text-muted-foreground">Running</div>
          <div className="text-xs text-blue-600 mt-1">{runningPercentage}%</div>
        </CardContent>
      </Card>

      <Card className={`${pendingModels.length > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 mb-2">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-amber-600 text-2xl font-bold">{pendingModels.length}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-xs text-amber-600 mt-1">{pendingPercentage}%</div>
        </CardContent>
      </Card>

      <Card className={`${completedModels.length > 0 ? "border-green-300 bg-green-50" : ""}`}>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-green-600 text-2xl font-bold">{completedModels.length}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-xs text-green-600 mt-1">{completedPercentage}%</div>
        </CardContent>
      </Card>

      <Card className={`${failedModels.length > 0 ? "border-red-300 bg-red-50" : ""}`}>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-red-600 text-2xl font-bold">{failedModels.length}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-xs text-red-600 mt-1">{failedPercentage}%</div>
        </CardContent>
      </Card>

      <Card className={`${frozenModels.length > 0 ? "border-blue-300 bg-blue-50" : ""}`}>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mb-2">
            <Snowflake className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-blue-600 text-2xl font-bold">{frozenModels.length}</div>
          <div className="text-sm text-muted-foreground">Frozen</div>
          <div className="text-xs text-blue-600 mt-1">{frozenPercentage}%</div>
        </CardContent>
      </Card>
    </div>
  )
}
