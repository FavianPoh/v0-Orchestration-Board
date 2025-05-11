"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Power, Play, AlertCircle, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useModelState } from "@/context/model-state-context"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function SequentialExecution() {
  const {
    modelGroups,
    getExecutionSequence,
    getParallelExecutionGroups,
    runModel,
    toggleModelEnabled,
    toggleBreakpoint,
    runModule,
    toggleModuleEnabled,
    getPausedOnModel,
  } = useModelState()
  const { toast } = useToast()
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({})
  const [breakpointHit, setBreakpointHit] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const executionSequence = getExecutionSequence()

  // Add automatic refresh every 500ms to update status colors
  useEffect(() => {
    const isAnyModelRunning = modelGroups.some((model) => model.status === "running")

    let intervalId
    if (isAnyModelRunning) {
      intervalId = setInterval(() => {
        setRefreshKey((prev) => prev + 1) // Force re-render
      }, 500)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [modelGroups])

  // Check for breakpoint hits
  useEffect(() => {
    const pausedModel = modelGroups.find(
      (model) =>
        model.breakpoint &&
        model.status === "idle" &&
        modelGroups.some((m) => m.status === "running") &&
        executionSequence.findIndex((m) => m.id === model.id) ===
          executionSequence.findIndex((m) => m.status === "running") + 1,
    )

    if (pausedModel) {
      setBreakpointHit(pausedModel.id)

      // Clear the breakpoint hit effect after 3 seconds
      const timeoutId = setTimeout(() => {
        setBreakpointHit(null)
      }, 3000)

      return () => clearTimeout(timeoutId)
    }
  }, [modelGroups, executionSequence, refreshKey])

  const toggleExpanded = (modelId: string) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }))
  }

  const handleRunModel = useCallback(
    (modelId: string, modelName: string) => {
      runModel(modelId)
      toast({
        title: "Running model",
        description: `Started execution of ${modelName}.`,
      })
    },
    [runModel, toast],
  )

  const handleToggleEnabled = useCallback(
    (modelId: string, modelName: string) => {
      toggleModelEnabled(modelId)
      toast({
        title: "Model toggled",
        description: `${modelName} has been ${
          modelGroups.find((m) => m.id === modelId)?.enabled ? "disabled" : "enabled"
        }.`,
      })
    },
    [modelGroups, toggleModelEnabled, toast],
  )

  const handleToggleBreakpoint = useCallback(
    (modelId: string, modelName: string) => {
      toggleBreakpoint(modelId)
      const model = modelGroups.find((m) => m.id === modelId)
      const hasBreakpoint = model?.breakpoint

      toast({
        title: `Breakpoint ${hasBreakpoint ? "removed" : "set"}`,
        description: `Execution will ${hasBreakpoint ? "not pause" : "pause"} before ${modelName}.`,
      })
    },
    [modelGroups, toggleBreakpoint, toast],
  )

  const handleRunModule = useCallback(
    (modelId: string, moduleId: string, moduleName: string) => {
      runModule(modelId, moduleId)
      toast({
        title: "Running module",
        description: `Started execution of ${moduleName}.`,
      })
    },
    [runModule, toast],
  )

  const handleToggleModuleEnabled = useCallback(
    (modelId: string, moduleId: string, moduleName: string, moduleEnabled: boolean) => {
      toggleModuleEnabled(modelId, moduleId)
      toast({
        title: "Module toggled",
        description: `${moduleName} has been ${moduleEnabled ? "disabled" : "enabled"}.`,
      })
    },
    [toggleModuleEnabled, toast],
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        )
      case "running":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Running
          </Badge>
        )
      case "paused":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Clock className="w-3 h-3 mr-1" /> Paused
          </Badge>
        )
      case "idle":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" /> Idle
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        )
      case "disabled":
        return (
          <Badge variant="outline" className="text-muted-foreground opacity-50">
            Disabled
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" /> {status}
          </Badge>
        )
    }
  }

  const getModelStatusClass = (model, index) => {
    // Check if any previous model is still running
    const isPreviousRunning = executionSequence.slice(0, index).some((m) => m.status === "running")

    // Determine if this model is waiting (previous models still running)
    const isWaiting = isPreviousRunning && model.status === "idle"

    // Determine if this is the next model to run
    const isNext =
      !isPreviousRunning &&
      model.status === "idle" &&
      executionSequence.slice(0, index).every((m) => m.status === "completed")

    // Check if this model is paused at a breakpoint
    const isPausedAtBreakpoint = model.status === "completed" && model.breakpoint && getPausedOnModel() === model.id

    switch (model.status) {
      case "completed":
        return isPausedAtBreakpoint
          ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
          : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
      case "running":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 animate-pulse"
      case "failed":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      case "disabled":
        return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 opacity-60"
      case "paused":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800"
      default:
        if (isNext) {
          return "bg-blue-50/30 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900"
        } else if (isWaiting) {
          return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
        }
        return ""
    }
  }

  const getModuleStatusClass = (module) => {
    switch (module.status) {
      case "completed":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
      case "running":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 animate-pulse"
      case "failed":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      case "disabled":
        return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 opacity-60"
      case "paused":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800"
      default:
        return ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sequential Execution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-0">
        {executionSequence.map((model, index) => (
          <div
            key={model.id}
            className={cn(
              "border-b last:border-b-0 transition-all duration-300",
              getModelStatusClass(model, index),
              breakpointHit === model.id ? "animate-pulse border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "",
              model.id.startsWith("test-model-") ? "border-2 border-blue-500 dark:border-blue-400" : "",
            )}
          >
            <div
              className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
              onClick={() => toggleExpanded(model.id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground",
                    model.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : model.status === "running"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : model.status === "failed"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : model.status === "paused"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            : "bg-muted",
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex items-center">
                  <span className="font-medium">{model.name}</span>
                  {model.optional && (
                    <Badge variant="outline" className="ml-2">
                      Optional
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleBreakpoint(model.id, model.name)
                  }}
                  className={model.breakpoint ? "text-red-500" : ""}
                >
                  <AlertCircle className={cn("h-4 w-4", model.breakpoint ? "text-red-500 animate-pulse" : "")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRunModel(model.id, model.name)
                  }}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleEnabled(model.id, model.name)
                  }}
                  className={model.enabled ? "text-green-500" : "text-gray-500"}
                >
                  <Power className="h-4 w-4" />
                </Button>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${expandedModels[model.id] ? "rotate-90" : ""}`}
                />
              </div>
            </div>

            {expandedModels[model.id] && model.modules && (
              <div className="p-4 pl-16 space-y-2 bg-background">
                <h4 className="text-sm font-medium mb-2">Modules</h4>
                {model.modules.map((module) => (
                  <div
                    key={module.id}
                    className={cn(
                      "flex justify-between items-center p-2 border rounded-md hover:bg-muted/50",
                      getModuleStatusClass(module),
                    )}
                  >
                    <div className="flex items-center">
                      <span className="text-sm">{module.name}</span>
                      {module.optional && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(module.status || "idle")}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleRunModule(model.id, module.id, module.name)
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleToggleModuleEnabled(model.id, module.id, module.name, module.enabled)
                        }}
                        className={module.enabled ? "text-green-500" : "text-gray-500"}
                      >
                        <Power className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
