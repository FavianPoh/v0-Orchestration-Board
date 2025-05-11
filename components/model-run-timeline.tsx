"use client"

import { useModelState } from "@/context/model-state-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, AlertTriangle, CheckCircle, RefreshCw, Clock, AlertCircle, StopCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function ModelRunTimeline({ parallelExecution = false }) {
  const {
    getExecutionSequence,
    getParallelExecutionGroups,
    runModel,
    pauseExecution,
    resumeExecution,
    resetOutputs,
    continueAfterBreakpoint,
    toggleBreakpoint,
    freezeExecution,
    isSimulationRunning,
    isSimulationPaused,
    isSimulationFrozen,
    getCurrentRunningModels,
    getPausedOnModel,
    getFailedModel,
  } = useModelState()

  const { toast } = useToast()
  const sequence = getExecutionSequence()
  const running = isSimulationRunning()
  const paused = isSimulationPaused()
  const frozen = isSimulationFrozen?.() || false
  const runningModels = getCurrentRunningModels()
  const pausedOnModel = getPausedOnModel()
  const failedModel = getFailedModel()

  // Check if a model is currently running
  const isModelRunning = (modelId) => {
    return runningModels.includes(modelId)
  }

  // Check if a model is paused
  const isModelPaused = (modelId) => {
    return pausedOnModel === modelId
  }

  // Check if a model has failed
  const isModelFailed = (modelId) => {
    return failedModel === modelId
  }

  // Format time duration
  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "—"
    const duration = Math.floor((endTime - startTime) / 1000)
    return `${duration}s`
  }

  // Handle running a specific model
  const handleRunModel = (modelId) => {
    runModel(modelId)
    toast({
      title: "Running model",
      description: "Started execution of the selected model",
    })
  }

  // Handle toggling a breakpoint
  const handleToggleBreakpoint = (modelId) => {
    toggleBreakpoint(modelId)
    toast({
      title: "Breakpoint toggled",
      description: "Execution will pause after this model",
    })
  }

  // Handle continue after breakpoint
  const handleContinueAfterBreakpoint = (modelId) => {
    if (!modelId) return
    continueAfterBreakpoint(modelId)
    toast({
      title: "Continuing execution",
      description: "Execution will continue from the paused model",
    })
  }

  // Handle pause/resume
  const handlePauseResume = () => {
    if (paused) {
      resumeExecution()
      toast({
        title: "Execution resumed",
        description: "Model execution has been resumed",
      })
    } else {
      pauseExecution()
      toast({
        title: "Execution paused",
        description: "Model execution has been paused",
      })
    }
  }

  // Handle reset
  const handleReset = () => {
    resetOutputs()
    toast({
      title: "Execution reset",
      description: "All model outputs have been reset",
    })
  }

  // Handle freeze
  const handleFreeze = () => {
    if (freezeExecution) {
      freezeExecution(!frozen)
      toast({
        title: frozen ? "Execution unfrozen" : "Execution frozen",
        description: frozen ? "Model execution can now continue" : "Model execution has been frozen",
      })
    } else {
      toast({
        title: "Freeze not available",
        description: "This functionality is not implemented yet",
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* Control buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          size="sm"
          variant={paused ? "outline" : "default"}
          onClick={handlePauseResume}
          disabled={!running && !paused}
          className="h-8 px-2 flex-1"
        >
          {paused ? (
            <>
              <Play className="h-3 w-3 mr-1" /> Resume
            </>
          ) : (
            <>
              <Pause className="h-3 w-3 mr-1" /> Pause
            </>
          )}
        </Button>

        <Button size="sm" variant="outline" onClick={handleReset} className="h-8 px-2 flex-1">
          <RefreshCw className="h-3 w-3 mr-1" /> Reset
        </Button>

        <Button
          size="sm"
          variant={frozen ? "destructive" : "outline"}
          onClick={handleFreeze}
          className="h-8 px-2 flex-1"
        >
          <StopCircle className="h-3 w-3 mr-1" /> {frozen ? "Unfreeze" : "Freeze"}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="h-[300px]">
        <div className="space-y-1 relative pl-6 border-l border-muted">
          {parallelExecution
            ? // Parallel execution view - group models by execution level
              getParallelExecutionGroups().map((group, groupIndex) => (
                <div key={`group-${groupIndex}`} className="mb-4">
                  <div className="flex items-center mb-2">
                    <Badge variant="outline" className="mr-2">
                      Group {groupIndex + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {group.length} model{group.length !== 1 ? "s" : ""} in parallel
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.map((model) => {
                      // Make sure model is defined before accessing its properties
                      if (!model || !model.id) {
                        return null // Skip this item if model is undefined
                      }

                      const isRunning = isModelRunning(model.id)
                      const isPaused = isModelPaused(model.id)
                      const isFailed = isModelFailed(model.id)

                      return (
                        <div
                          key={model.id}
                          className={`mb-4 relative rounded-md p-3 
                  ${model.id.startsWith("test-model-") ? "border-l-4 border-blue-400" : ""}
                  ${isRunning ? "border-2 border-blue-500 bg-blue-50" : ""}
                  ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}
                  ${isFailed ? "border-2 border-red-500 bg-red-50" : ""}
                  ${model.breakpoint ? "border-l-4 border-red-400" : ""}`}
                        >
                          <div
                            className={`absolute -left-3 w-5 h-5 rounded-full flex items-center justify-center
                    ${
                      model.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : isRunning
                          ? "bg-blue-100 text-blue-600"
                          : isPaused
                            ? "bg-yellow-100 text-yellow-600"
                            : isFailed
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                    }`}
                          >
                            {model.status === "completed" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : isRunning ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isPaused ? (
                              <Pause className="w-3 h-3" />
                            ) : isFailed ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <span className="text-xs">{groupIndex + 1}</span>
                            )}
                          </div>
                          <div className="pl-2">
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-medium ${model.id.startsWith("test-model-") ? "text-blue-700" : ""}`}
                              >
                                {model.name || `Model ${groupIndex + 1}`}
                                {model.breakpoint && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs bg-red-50 text-red-600 border-red-200"
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Breakpoint
                                  </Badge>
                                )}
                              </span>
                              <Badge
                                className={`
                        ${model.status === "completed" ? "bg-green-100 text-green-600" : ""}
                        ${model.status === "running" ? "bg-blue-100 text-blue-600" : ""}
                        ${model.status === "failed" ? "bg-red-100 text-red-600" : ""}
                        ${model.status === "blocked" ? "bg-orange-100 text-orange-600" : ""}
                        ${model.status === "idle" ? "bg-gray-100 text-gray-600" : ""}
                      `}
                              >
                                {model.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                                {model.status === "running" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                                {model.status === "failed" && <AlertCircle className="w-3 h-3 mr-1" />}
                                {model.status === "blocked" && <Clock className="w-3 h-3 mr-1" />}
                                {model.status === "idle" && <Clock className="w-3 h-3 mr-1" />}
                                {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                              </Badge>
                            </div>
                            {model.startTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Started: {new Date(model.startTime).toLocaleTimeString()}
                              </p>
                            )}
                            {model.endTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed: {new Date(model.endTime).toLocaleTimeString()}
                                {model.startTime && (
                                  <span className="ml-2">({formatDuration(model.startTime, model.endTime)})</span>
                                )}
                              </p>
                            )}
                            {model.status === "running" && (
                              <Progress value={model.progress || 0} className="h-1 mt-2" />
                            )}

                            {/* Control buttons */}
                            <div className="flex mt-3 space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleRunModel(model.id)}
                                title="Run this model"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  if (isRunning) {
                                    pauseExecution()
                                  } else if (isPaused) {
                                    handleContinueAfterBreakpoint(model.id)
                                  }
                                }}
                                title={isPaused ? "Continue execution" : "Pause execution"}
                              >
                                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 ${model.breakpoint ? "text-red-500" : ""}`}
                                onClick={() => handleToggleBreakpoint(model.id)}
                                title={model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={handleFreeze}
                                title={frozen ? "Unfreeze execution" : "Freeze execution"}
                              >
                                <StopCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            : // Sequential execution view - render models in sequence
              sequence.map((model, index) => {
                // Make sure model is defined before accessing its properties
                if (!model || !model.id) {
                  return null // Skip this item if model is undefined
                }

                const isRunning = isModelRunning(model.id)
                const isPaused = isModelPaused(model.id)
                const isFailed = isModelFailed(model.id)

                return (
                  <div
                    key={model.id}
                    className={`mb-4 relative rounded-md p-3 
                  ${model.id.startsWith("test-model-") ? "border-l-4 border-blue-400" : ""}
                  ${isRunning ? "border-2 border-blue-500 bg-blue-50" : ""}
                  ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}
                  ${isFailed ? "border-2 border-red-500 bg-red-50" : ""}
                  ${model.breakpoint ? "border-l-4 border-red-400" : ""}`}
                  >
                    <div
                      className={`absolute -left-3 w-5 h-5 rounded-full flex items-center justify-center
                    ${
                      model.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : isRunning
                          ? "bg-blue-100 text-blue-600"
                          : isPaused
                            ? "bg-yellow-100 text-yellow-600"
                            : isFailed
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                    }`}
                    >
                      {model.status === "completed" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : isRunning ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : isPaused ? (
                        <Pause className="w-3 h-3" />
                      ) : isFailed ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <div className="pl-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${model.id.startsWith("test-model-") ? "text-blue-700" : ""}`}>
                          {model.name || `Model ${index + 1}`}
                          {model.breakpoint && (
                            <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Breakpoint
                            </Badge>
                          )}
                        </span>
                        <Badge
                          className={`
                        ${model.status === "completed" ? "bg-green-100 text-green-600" : ""}
                        ${model.status === "running" ? "bg-blue-100 text-blue-600" : ""}
                        ${model.status === "failed" ? "bg-red-100 text-red-600" : ""}
                        ${model.status === "blocked" ? "bg-orange-100 text-orange-600" : ""}
                        ${model.status === "idle" ? "bg-gray-100 text-gray-600" : ""}
                      `}
                        >
                          {model.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {model.status === "running" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {model.status === "failed" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {model.status === "blocked" && <Clock className="w-3 h-3 mr-1" />}
                          {model.status === "idle" && <Clock className="w-3 h-3 mr-1" />}
                          {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                        </Badge>
                      </div>
                      {model.startTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Started: {new Date(model.startTime).toLocaleTimeString()}
                        </p>
                      )}
                      {model.endTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed: {new Date(model.endTime).toLocaleTimeString()}
                          {model.startTime && (
                            <span className="ml-2">({formatDuration(model.startTime, model.endTime)})</span>
                          )}
                        </p>
                      )}
                      {model.status === "running" && <Progress value={model.progress || 0} className="h-1 mt-2" />}

                      {/* Control buttons */}
                      <div className="flex mt-3 space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleRunModel(model.id)}
                          title="Run this model"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => {
                            if (isRunning) {
                              pauseExecution()
                            } else if (isPaused) {
                              handleContinueAfterBreakpoint(model.id)
                            }
                          }}
                          title={isPaused ? "Continue execution" : "Pause execution"}
                        >
                          {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 ${model.breakpoint ? "text-red-500" : ""}`}
                          onClick={() => handleToggleBreakpoint(model.id)}
                          title={model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={handleFreeze}
                          title={frozen ? "Unfreeze execution" : "Freeze execution"}
                        >
                          <StopCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      </ScrollArea>
    </div>
  )
}
