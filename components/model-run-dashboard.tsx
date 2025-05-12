"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useModelState } from "@/context/model-state-context"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, CheckCircle } from "lucide-react"
import { useState } from "react"

export function ModelRunDashboard() {
  const { modelGroups, getExecutionSequence } = useModelState()
  const sequence = getExecutionSequence()

  // Group models by status
  const pendingModels = sequence.filter((model) => model.status === "idle")
  const runningModels = sequence.filter((model) => model.status === "running")
  const completedModels = sequence.filter((model) => model.status === "completed")
  const failedModels = sequence.filter((model) => model.status === "failed")

  // If this component is used, ensure it also passes the correct parallelExecution state

  // Find where parallelExecution state is defined and make sure it's set to true by default
  const [parallelExecution, setParallelExecution] = useState(true)

  // Find where the EnhancedExecutionSequence component is rendered and ensure it receives the correct props
  // <EnhancedExecutionSequence
  //   parallelExecution={parallelExecution}
  //   onToggleParallelExecution={toggleParallelExecution}
  // />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left sidebar - Timeline */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Model Run Timeline</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[calc(100vh-300px)]">
          <div className="space-y-4">
            <div className="relative pl-6 border-l border-muted">
              {sequence.map((model, index) => (
                <div key={model.id} className="mb-4 relative">
                  <div
                    className={`absolute -left-3 w-5 h-5 rounded-full flex items-center justify-center
                      ${
                        model.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : model.status === "running"
                            ? "bg-blue-100 text-blue-600"
                            : model.status === "failed"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {model.status === "completed" ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : model.status === "running" ? (
                      <Clock className="w-3 h-3" />
                    ) : model.status === "failed" ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div className="pl-4">
                    <div className="flex items-center">
                      <span className="font-medium">{model.name}</span>
                      <Badge
                        className={`ml-2 
                          ${
                            model.status === "completed"
                              ? "bg-green-100 text-green-600"
                              : model.status === "running"
                                ? "bg-blue-100 text-blue-600"
                                : model.status === "failed"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {model.status === "idle"
                          ? "Pending"
                          : model.status === "running"
                            ? "Running"
                            : model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                      </Badge>
                    </div>
                    {model.startTime && (
                      <p className="text-xs text-muted-foreground">
                        Started: {new Date(model.startTime).toLocaleTimeString()}
                      </p>
                    )}
                    {model.endTime && (
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(model.endTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right side - Status Cards */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Execution Sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sequence.map((model, index) => (
                <div
                  key={model.id}
                  className={`p-2 rounded-md border flex items-center justify-between
                    ${model.id.startsWith("test-model-") ? "border-blue-300 bg-blue-50" : "border-gray-200"}
                    ${model.status === "running" ? "bg-blue-50" : model.status === "completed" ? "bg-green-50" : ""}`}
                >
                  <div className="flex items-center">
                    <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                      {index + 1}
                    </span>
                    <span className={model.id.startsWith("test-model-") ? "font-bold text-blue-700" : ""}>
                      {model.name}
                    </span>
                  </div>
                  <Badge
                    variant={
                      model.status === "completed"
                        ? "outline"
                        : model.status === "running"
                          ? "secondary"
                          : model.status === "failed"
                            ? "destructive"
                            : "default"
                    }
                  >
                    {model.status === "idle" ? "Pending" : model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Run Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md p-3 bg-blue-50">
                <div className="text-blue-600 text-lg font-bold">{runningModels.length}</div>
                <div className="text-sm text-muted-foreground">Running</div>
              </div>
              <div className="border rounded-md p-3 bg-amber-50">
                <div className="text-amber-600 text-lg font-bold">{pendingModels.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="border rounded-md p-3 bg-green-50">
                <div className="text-green-600 text-lg font-bold">{completedModels.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="border rounded-md p-3 bg-red-50">
                <div className="text-red-600 text-lg font-bold">{failedModels.length}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ModelRunDashboard
