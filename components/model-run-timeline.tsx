"use client"

import { useModelState } from "@/context/model-state-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, AlertTriangle, CheckCircle, RefreshCw, Clock, AlertCircle, StopCircle, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { isDormant } from "@/lib/utils"
import { useEffect, useState, useRef } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

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
    getModelById,
    getRunId,
  } = useModelState()

  const { toast } = useToast()
  const sequence = getExecutionSequence()
  const running = isSimulationRunning()
  const paused = isSimulationPaused()
  const frozen = isSimulationFrozen?.() || false
  const runningModels = getCurrentRunningModels()
  const pausedOnModel = getPausedOnModel()
  const failedModel = getFailedModel()
  const [refreshKey, setRefreshKey] = useState(0)
  // Add a ref to track if the sheet is already opening to prevent multiple opens
  const isOpeningSheet = useRef(false)

  const isDormantState = isDormant()

  const [selectedModel, setSelectedModel] = useState(null)
  const [isModelDetailsOpen, setIsModelDetailsOpen] = useState(false)

  // Add a click throttling mechanism to prevent multiple rapid clicks
  const [lastClickTime, setLastClickTime] = useState(0)
  const CLICK_THROTTLE_MS = 300 // Minimum time between clicks

  // Add this function to open model details with debounce
  const router = useRouter()
  const openModelDetails = (model, e) => {
    // If the event exists, stop propagation and prevent default
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // Navigate to the model details page instead of opening a sheet
    router.push(`/model-groups/${model.id}`)
  }

  // Reset the opening flag when the sheet closes
  useEffect(() => {
    if (!isModelDetailsOpen) {
      isOpeningSheet.current = false
    }
  }, [isModelDetailsOpen])

  // Modify the useEffect that checks for dormant state
  useEffect(() => {
    if (isDormantState) {
      console.log("Model Run Timeline detected dormant state, but will still display models")
      // Force a refresh to ensure models are displayed
      setRefreshKey((prev) => prev + 1)
    }
  }, [isDormantState])

  // Add this useEffect to ensure models are always displayed
  useEffect(() => {
    // Force a refresh when the component mounts to ensure models are displayed
    setRefreshKey((prev) => prev + 1)
  }, [])

  // Add a useEffect to check for dormant state and force UI refresh
  useEffect(() => {
    // Check for dormant state every second
    const checkInterval = setInterval(() => {
      const isDormantNow = document.documentElement.getAttribute("data-simulation-running") === null

      if (isDormantNow && running) {
        console.log("Timeline detected dormant state but UI shows running - forcing refresh")
        setRefreshKey((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(checkInterval)
  }, [running])

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

  // Function to show toast notifications with model outputs
  const showModelToast = (model, status) => {
    if (!model) return

    let title = ""
    let description = ""

    switch (status) {
      case "completed":
        title = `${model.name} completed`
        description = "Model execution completed successfully"
        break
      case "running":
        title = `Running ${model.name}`
        description = "Model execution in progress"
        break
      case "failed":
        title = `${model.name} failed`
        description = "Model execution failed"
        break
      default:
        title = `${model.name} ${status}`
        description = `Model is now ${status}`
    }

    // Add output information to the toast if available
    let outputInfo = ""
    if (model.outputs && model.outputs.length > 0 && status === "completed") {
      // Only use actual values, don't generate random ones
      outputInfo = model.outputs
        .map((output) => `${output.name}: ${output.value || "—"}${output.unit ? " " + output.unit : ""}`)
        .join("\n")

      if (outputInfo) {
        description += `\n\nOutputs:\n${outputInfo}`
      }
    }

    // Show the toast
    toast({
      title,
      description,
      duration: 5000,
    })
  }

  // CRITICAL FIX: This is the function that needs to be fixed to prevent the popup
  const handleToggleBreakpoint = (modelId, e) => {
    // Stop event propagation and prevent default behavior
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    const model = getModelById(modelId)
    const isCurrentlyBreakpointed = model && model.breakpoint

    // Toggle the breakpoint without showing the modal
    toggleBreakpoint(modelId)

    // Apply immediate visual feedback by directly updating the DOM
    // Find the model element for this model and add/remove a class
    const modelElement = document.querySelector(`[data-model-id="${modelId}"]`)
    if (modelElement) {
      if (isCurrentlyBreakpointed) {
        modelElement.classList.remove("has-breakpoint")
        modelElement.classList.remove("border-l-4")
        modelElement.classList.remove("border-red-500")
        modelElement.classList.remove("bg-red-50/30")
        modelElement.classList.remove("shadow-[0_0_0_1px_rgba(239,68,68,0.3)]")
      } else {
        modelElement.classList.add("has-breakpoint")
        modelElement.classList.add("border-l-4")
        modelElement.classList.add("border-red-500")
        modelElement.classList.add("bg-red-50/30")
        modelElement.classList.add("shadow-[0_0_0_1px_rgba(239,68,68,0.3)]")
      }
    }

    // Find the breakpoint button and update its appearance
    const breakpointButton = document.querySelector(`[data-model-id="${modelId}"] button[title*="breakpoint"]`)
    if (breakpointButton) {
      if (isCurrentlyBreakpointed) {
        breakpointButton.classList.remove("text-red-500")
        breakpointButton.classList.remove("bg-red-50/30")
      } else {
        breakpointButton.classList.add("text-red-500")
        breakpointButton.classList.add("bg-red-50/30")
      }
    }

    // Only show a small toast notification instead of a modal
    toast({
      title: isCurrentlyBreakpointed ? "Breakpoint removed" : "Breakpoint set",
      description: isCurrentlyBreakpointed
        ? "Execution will continue without pausing"
        : "Execution will pause after this model completes",
      duration: 2000,
    })

    // Force a refresh to ensure the UI updates immediately
    setRefreshKey((prev) => prev + 1)
  }

  // Handle running a specific model
  const handleRunModel = (modelId) => {
    const model = getModelById(modelId)
    if (model) {
      showModelToast(model, "running")
    }

    runModel(modelId)
    toast({
      title: "Running model",
      description: "Started execution of the selected model",
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

      <ScrollArea className="h-[700px]">
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
                          data-model-id={model.id}
                          className={`mb-4 relative rounded-md p-3 cursor-pointer
                  ${model.id.startsWith("test-model-") ? "border-l-4 border-blue-400" : ""}
                  ${isRunning ? "border-2 border-blue-500 bg-blue-50" : ""}
                  ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}
                  ${isFailed ? "border-2 border-red-500 bg-red-50" : ""}
                  ${model.breakpoint ? "has-breakpoint border-l-4 border-red-500 bg-red-50/30 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]" : ""}
                  ${isPaused && model.id === pausedOnModel ? "border-2 border-amber-500 bg-amber-100/60 shadow-md animate-pulse" : ""}
                  ${
                    model.status === "blocked" &&
                    getModelById(model.blockingDependencyId) &&
                    getPausedOnModel() === model.blockingDependencyId
                      ? "border-l-2 border-orange-400 bg-orange-50/20"
                      : ""
                  }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            openModelDetails(model, e)
                          }}
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

                            {/* Display model outputs */}
                            {model.outputs && model.outputs.length > 0 && (
                              <div className="mt-2 text-sm">
                                <div className="grid grid-cols-1 gap-1">
                                  {model.outputs.map((output, i) => (
                                    <div key={i} className="flex items-center">
                                      <span className="font-medium mr-1">{output.name}:</span>
                                      <span className="text-gray-700">{output.value || "—"}</span>
                                      {output.unit && <span className="text-xs ml-1 text-gray-500">{output.unit}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Display upstream dependencies */}
                            {model.dependencies && model.dependencies.length > 0 && (
                              <div className="mt-2 text-xs">
                                <div className="text-muted-foreground mb-1">Upstream Dependencies:</div>
                                <div className="flex flex-wrap gap-1">
                                  {model.dependencies.map((depId) => {
                                    const depModel = getModelById(depId)
                                    if (!depModel) return null

                                    const badgeClass =
                                      depModel.status === "completed"
                                        ? "bg-green-50 text-green-600 border-green-200"
                                        : depModel.status === "running"
                                          ? "bg-blue-50 text-blue-600 border-blue-200"
                                          : depModel.status === "failed"
                                            ? "bg-red-50 text-red-600 border-red-200"
                                            : depModel.status === "blocked"
                                              ? "bg-orange-50 text-orange-600 border-orange-200"
                                              : "bg-gray-50 text-gray-600 border-gray-200"

                                    return (
                                      <Badge
                                        key={depId}
                                        variant="outline"
                                        className={`text-xs cursor-pointer ${badgeClass}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          e.preventDefault()
                                          router.push(`/model-groups/${depId}`)
                                        }}
                                      >
                                        {depModel.name || depId}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Control buttons */}
                            <div className="flex mt-3 space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  handleRunModel(model.id)
                                }}
                                title="Run this model"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
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
                                className={`h-7 px-2 rounded-md ${
                                  model.breakpoint
                                    ? "bg-red-100 hover:bg-red-200 text-red-600 border border-red-300"
                                    : "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  handleToggleBreakpoint(model.id, e)
                                }}
                                title={model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  handleFreeze()
                                }}
                                title={frozen ? "Unfreeze execution" : "Freeze execution"}
                              >
                                <StopCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openModelDetails(model, e)
                                }}
                                title="View model details"
                              >
                                <Info className="h-3 w-3" />
                              </Button>
                              {isPaused && model.id === pausedOnModel && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-2 mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    handleContinueAfterBreakpoint(model.id)
                                  }}
                                  title="Continue execution past breakpoint"
                                >
                                  <Play className="h-3 w-3 mr-1" /> Resume Run #{getRunId()?.substring(0, 4)}
                                </Button>
                              )}
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
                    data-model-id={model.id}
                    className={`mb-4 relative rounded-md p-3 cursor-pointer
                  ${model.id.startsWith("test-model-") ? "border-l-4 border-blue-400" : ""}
                  ${isRunning ? "border-2 border-blue-500 bg-blue-50" : ""}
                  ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}
                  ${isFailed ? "border-2 border-red-500 bg-red-50" : ""}
                  ${model.breakpoint ? "has-breakpoint border-l-4 border-red-500 bg-red-50/30 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]" : ""}
                  ${isPaused && model.id === pausedOnModel ? "border-2 border-amber-500 bg-amber-100/60 shadow-md animate-pulse" : ""}
                  ${
                    model.status === "blocked" &&
                    getModelById(model.blockingDependencyId) &&
                    getPausedOnModel() === model.blockingDependencyId
                      ? "border-l-2 border-orange-400 bg-orange-50/20"
                      : ""
                  }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      openModelDetails(model, e)
                    }}
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

                      {/* Display model outputs */}
                      {model.outputs && model.outputs.length > 0 && (
                        <div className="mt-2 text-sm">
                          <div className="grid grid-cols-1 gap-1">
                            {model.outputs.map((output, i) => (
                              <div
                                key={i}
                                className={`flex items-center ${output.changed ? "bg-blue-50 p-1 rounded-md" : ""}`}
                              >
                                <span className="font-medium mr-1">{output.name}:</span>
                                <span className="text-gray-700">
                                  {output.value !== null && output.value !== undefined ? output.value : "—"}
                                </span>
                                {output.unit && <span className="text-xs ml-1 text-gray-500">{output.unit}</span>}
                                {output.changed && <RefreshCw className="h-3 w-3 ml-1 text-blue-500" />}
                              </div>
                            ))}
                          </div>

                          {/* Add warning for breakpoints */}
                          {model.breakpoint && (
                            <div className="mt-1 text-xs text-red-500 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span>Outputs blocked at breakpoint</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display upstream dependencies */}
                      {model.dependencies && model.dependencies.length > 0 && (
                        <div className="mt-2 text-xs">
                          <div className="text-muted-foreground mb-1">Upstream Dependencies:</div>
                          <div className="flex flex-wrap gap-1">
                            {model.dependencies.map((depId) => {
                              const depModel = getModelById(depId)
                              if (!depModel) return null

                              const badgeClass =
                                depModel.status === "completed"
                                  ? "bg-green-50 text-green-600 border-green-200"
                                  : depModel.status === "running"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : depModel.status === "failed"
                                      ? "bg-red-50 text-red-600 border-red-200"
                                      : depModel.status === "blocked"
                                        ? "bg-orange-50 text-orange-600 border-orange-200"
                                        : "bg-gray-50 text-gray-600 border-gray-200"

                              return (
                                <Badge
                                  key={depId}
                                  variant="outline"
                                  className={`text-xs cursor-pointer ${badgeClass}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    router.push(`/model-groups/${depId}`)
                                  }}
                                >
                                  {depModel.name || depId}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Control buttons */}
                      <div className="flex mt-3 space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleRunModel(model.id)
                          }}
                          title="Run this model"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
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
                        {/* Update the breakpoint button in the ModelRunTimeline component */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 rounded-md ${
                            model.breakpoint
                              ? "bg-red-100 hover:bg-red-200 text-red-600 border border-red-300"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200"
                          }`}
                          data-breakpoint-active={model.breakpoint ? "true" : "false"}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleToggleBreakpoint(model.id, e)
                          }}
                          title={model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleFreeze()
                          }}
                          title={frozen ? "Unfreeze execution" : "Freeze execution"}
                        >
                          <StopCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            openModelDetails(model, e)
                          }}
                          title="View model details"
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                        {isPaused && model.id === pausedOnModel && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 px-2 mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              handleContinueAfterBreakpoint(model.id)
                            }}
                            title="Continue execution past breakpoint"
                          >
                            <Play className="h-3 w-3 mr-1" /> Resume Run #{getRunId()?.substring(0, 4)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      </ScrollArea>
      {/* Model Details Sheet */}
      {selectedModel && (
        <Sheet open={isModelDetailsOpen} onOpenChange={setIsModelDetailsOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] md:w-[600px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedModel.name}</SheetTitle>
              <SheetDescription>{selectedModel.description || "Model details and configuration"}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {/* Model Status */}
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <Badge
                  className={`
              ${selectedModel.status === "completed" ? "bg-green-100 text-green-600" : ""}
              ${selectedModel.status === "running" ? "bg-blue-100 text-blue-600" : ""}
              ${selectedModel.status === "failed" ? "bg-red-100 text-red-600" : ""}
              ${selectedModel.status === "blocked" ? "bg-orange-100 text-orange-600" : ""}
              ${selectedModel.status === "idle" ? "bg-gray-100 text-gray-600" : ""}
            `}
                >
                  {selectedModel.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                  {selectedModel.status === "running" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {selectedModel.status === "failed" && <AlertCircle className="w-3 h-3 mr-1" />}
                  {selectedModel.status === "blocked" && <Clock className="w-3 h-3 mr-1" />}
                  {selectedModel.status === "idle" && <Clock className="w-3 h-3 mr-1" />}
                  {selectedModel.status.charAt(0).toUpperCase() + selectedModel.status.slice(1)}
                </Badge>
              </div>

              {selectedModel &&
                selectedModel.status === "blocked" &&
                getModelById(selectedModel.blockingDependencyId) &&
                getPausedOnModel() === selectedModel.blockingDependencyId && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center text-orange-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">Waiting on Breakpoint</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      This model is waiting for {getModelById(selectedModel.blockingDependencyId)?.name}
                      which is paused at a breakpoint
                    </p>
                  </div>
                )}

              {selectedModel.breakpoint && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="font-medium">Breakpoint Active</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">Execution will pause after this model completes</p>
                </div>
              )}

              {/* Model Outputs */}
              {selectedModel.outputs && selectedModel.outputs.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Outputs</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedModel.outputs.map((output, i) => (
                      <div key={i} className="bg-gray-50 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{output.name}</span>
                        </div>
                        <span className="text-gray-700">
                          {output.value !== null && output.value !== undefined ? output.value : "—"}
                        </span>
                        {output.unit && <span className="text-xs ml-1 text-gray-500">{output.unit}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
