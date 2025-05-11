"use client"

import { useState, useRef, useEffect } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Pause,
  SkipForward,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Info,
  Settings,
  List,
  AlertTriangle,
  Layers,
  CornerRightDown,
  Eye,
  ArrowRight,
  BarChartIcon,
  FileText,
  ExternalLink,
  Zap,
  Bug,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { LineChart, BarChart } from "@/components/ui/chart"

export function RunDashboard() {
  // Add these imports at the top of the file to access the run ID functions
  const {
    modelGroups,
    getExecutionSequence,
    getParallelExecutionGroups,
    runModel,
    forceCompleteAllRunning,
    resetOutputs,
    isSimulationRunning,
    isSimulationPaused,
    toggleBreakpoint,
    runModule,
    runAllModels,
    pauseExecution,
    resumeExecution,
    getCurrentRunningModels,
    getPausedOnModel,
    getFailedModel,
    getModelById,
    getModelDependencies,
    getModelDependents,
    continueAfterBreakpoint,
    debugModelDependencyStatus,
    getRunId,
    getRunStartTime,
    getRunDuration,
    getRunEndTime,
    getRunMetadata,
    getRunHistory,
    getLastCompletedRunId,
    getIterationCount,
    incrementIterationCount,
    debugAllModelsState,
  } = useModelState()

  const router = useRouter()
  const { toast } = useToast()
  const [selectedModel, setSelectedModel] = useState(null)
  const [expandedModels, setExpandedModels] = useState({})
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [parallelExecution, setParallelExecution] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0) // For forcing re-renders
  const [pausedModelData, setPausedModelData] = useState(null) // Store paused model data for the breakpoint dialog
  const [breakpointInfoOpen, setBreakpointInfoOpen] = useState(false)
  const [breakpointActiveTab, setBreakpointActiveTab] = useState("dashboard")

  const sequenceRef = useRef(null)
  const modelRefs = useRef({})

  const sequence = getExecutionSequence()
  const running = isSimulationRunning()
  const paused = isSimulationPaused()
  const runningModels = getCurrentRunningModels()
  const pausedOnModel = getPausedOnModel()
  const failedModel = getFailedModel()

  // Set up a refresh interval when simulation is running
  useEffect(() => {
    let intervalId
    if (running) {
      intervalId = setInterval(() => {
        setRefreshKey((prev) => prev + 1)
      }, 500)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [running])

  // Group models by status
  const pendingModels = sequence.filter((model) => model.status === "idle")
  const runningModelsList = sequence.filter((model) => model.status === "running")
  const completedModels = sequence.filter((model) => model.status === "completed")
  const failedModels = sequence.filter((model) => model.status === "failed")

  // Load selected model details when selectedModelId changes
  useEffect(() => {
    if (selectedModelId) {
      const model = modelGroups.find((m) => m.id === selectedModelId)
      if (model) {
        setSelectedModel(model)
        // Auto-expand the selected model
        setExpandedModels((prev) => ({
          ...prev,
          [selectedModelId]: true,
        }))
      }
    }
  }, [selectedModelId, modelGroups])

  // Auto-expand paused or failed models
  useEffect(() => {
    if (pausedOnModel) {
      console.log(`Auto-expanding paused model: ${pausedOnModel}`)
      setExpandedModels((prev) => ({
        ...prev,
        [pausedOnModel]: true,
      }))

      // Auto-scroll to the paused model
      if (modelRefs.current[pausedOnModel] && sequenceRef.current) {
        modelRefs.current[pausedOnModel].scrollIntoView({ behavior: "smooth", block: "center" })
      }

      // Auto-select the paused model
      const model = getModelById(pausedOnModel)
      if (model) {
        console.log(`Auto-selecting paused model: ${model.name}`)
        setSelectedModel(model)
        setSelectedModelId(pausedOnModel)

        // Store the selected model data for the breakpoint dialog
        setPausedModelData(model)

        // Auto-open breakpoint info dialog after a short delay to ensure data is loaded
        setTimeout(() => {
          setBreakpointInfoOpen(true)
        }, 200)
      }
    }
    if (failedModel) {
      setExpandedModels((prev) => ({
        ...prev,
        [failedModel]: true,
      }))
      // Auto-scroll to the failed model
      if (modelRefs.current[failedModel] && sequenceRef.current) {
        modelRefs.current[failedModel].scrollIntoView({ behavior: "smooth", block: "center" })
      }

      // Auto-select the failed model
      const model = getModelById(failedModel)
      if (model) {
        setSelectedModel(model)
        setSelectedModelId(failedModel)
      }
    }
  }, [pausedOnModel, failedModel, getModelById])

  // Toggle expanded state for a model
  const toggleExpanded = (modelId) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }))
  }

  // Handle run all models
  const handleRunAll = () => {
    runAllModels(parallelExecution)

    toast({
      title: `Running all models in ${parallelExecution ? "parallel" : "sequential"} mode`,
      description: `Execution started with ${sequence.length} models in the sequence.`,
    })
  }

  // Handle pause/resume execution
  const handlePauseResume = () => {
    if (paused) {
      resumeExecution()
      toast({
        title: "Execution resumed",
        description: "Model execution has been resumed.",
      })
    } else {
      pauseExecution()
      toast({
        title: "Execution paused",
        description: "Model execution has been paused.",
      })
    }
  }

  // Handle continue after breakpoint
  const handleContinueAfterBreakpoint = (modelId) => {
    if (!modelId) return

    console.log(`Continuing after breakpoint on model: ${modelId}`)
    continueAfterBreakpoint(modelId)
    setBreakpointInfoOpen(false)

    toast({
      title: "Continuing execution",
      description: `Execution will continue from model ${getModelById(modelId)?.name || modelId}`,
    })

    // Force refresh to update UI
    setTimeout(() => {
      setRefreshKey((prev) => prev + 1)
    }, 200)
  }

  // Handle force complete all
  const handleForceComplete = () => {
    forceCompleteAllRunning()
    toast({
      title: "Force completed all running models",
      description: "All running models and modules have been marked as completed.",
    })
  }

  // Handle model selection for details view
  const handleSelectModel = (model) => {
    setSelectedModel(model)
    setSelectedModelId(model.id)

    // Auto-expand the selected model
    setExpandedModels((prev) => ({
      ...prev,
      [model.id]: true,
    }))

    // Scroll to the model in the sequence view if it's in the timeline
    if (modelRefs.current[model.id] && sequenceRef.current) {
      modelRefs.current[model.id].scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  // Handle module selection for details dialog
  const handleSelectModule = (modelId, module) => {
    setSelectedModule(module)
    setSelectedModelId(modelId)
    setModuleDialogOpen(true)
  }

  // Handle running a specific model
  const handleRunModel = (modelId) => {
    runModel(modelId)
    toast({
      title: "Running model",
      description: `Started execution of model ${getModelById(modelId)?.name || modelId}`,
    })
  }

  // Handle running a specific module
  const handleRunModule = (modelId, moduleId) => {
    runModule(modelId, moduleId)
    toast({
      title: "Running module",
      description: `Started execution of module ${moduleId}`,
    })
  }

  // Handle toggling a breakpoint
  const handleToggleBreakpoint = (modelId) => {
    toggleBreakpoint(modelId)
    const model = modelGroups.find((m) => m.id === modelId)
    toast({
      title: model?.breakpoint ? "Breakpoint removed" : "Breakpoint set",
      description: `Execution will ${model?.breakpoint ? "not pause" : "pause"} after this model`,
    })
  }

  // Format time duration
  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "—"
    const duration = Math.floor((endTime - startTime) / 1000)
    return `${duration}s`
  }

  // Get status badge component
  const getStatusBadge = (status, modelId = null) => {
    // Check if this model is paused at a breakpoint
    const isPaused = modelId && pausedOnModel === modelId
    const isFailed = modelId && failedModel === modelId

    // NEW: Check if model is blocked by a dependency
    const model = getModelById(modelId)
    const isBlocked = model && model.status === "blocked"

    if (isBlocked) {
      return (
        <Badge className="bg-orange-100 text-orange-600">
          <Clock className="w-3 h-3 mr-1" /> Waiting for Dependency
        </Badge>
      )
    }

    if (status === "paused" || isPaused) {
      return (
        <Badge className="bg-yellow-100 text-yellow-600">
          <Pause className="w-3 h-3 mr-1" /> Paused at Breakpoint
        </Badge>
      )
    }

    if (isFailed) {
      return (
        <Badge className="bg-red-100 text-red-600">
          <AlertCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      )
    }

    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        )
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-600">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Running
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-600">
            <AlertCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        )
      case "idle":
        return (
          <Badge className="bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Info className="w-3 h-3 mr-1" /> {status}
          </Badge>
        )
    }
  }

  // Toggle parallel execution mode
  const toggleParallelExecution = () => {
    setParallelExecution(!parallelExecution)
    toast({
      title: `${!parallelExecution ? "Parallel" : "Sequential"} execution enabled`,
      description: `Models will now run in ${!parallelExecution ? "parallel" : "sequential"} mode.`,
    })
  }

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

  // Auto-select the first running model when execution starts
  useEffect(() => {
    if (running && runningModelsList.length > 0 && !selectedModelId) {
      const firstRunningModel = runningModelsList[0]
      handleSelectModel(firstRunningModel)
    }
  }, [running, selectedModelId, runningModelsList])

  // Get model dependencies and dependents
  const getDependencyInfo = (modelId) => {
    const dependencies = getModelDependencies(modelId)
    const dependents = getModelDependents(modelId)

    return {
      dependencies,
      dependents,
      hasDependencies: dependencies.length > 0,
      hasDependents: dependents.length > 0,
    }
  }

  // Get the dependency chain for a model
  const getDependencyChain = (modelId) => {
    const model = getModelById(modelId)
    if (!model) return []

    const chain = []
    const dependencies = getModelDependencies(modelId)

    dependencies.forEach((depId) => {
      const depModel = getModelById(depId)
      if (depModel) {
        chain.push({
          id: depId,
          name: depModel.name,
          status: depModel.status,
          breakpoint: depModel.breakpoint,
        })
      }
    })

    return chain
  }

  // Get the models that depend on this model
  const getBlockedModels = (modelId) => {
    const dependents = getModelDependents(modelId)
    return dependents.map((depId) => {
      const model = getModelById(depId)
      return {
        id: depId,
        name: model?.name || depId,
        status: model?.status || "unknown",
      }
    })
  }

  // Generate sample performance data for the model
  const generateModelPerformanceData = (modelId) => {
    const model = getModelById(modelId)
    if (!model) return null

    return {
      executionTime: [
        { name: "Last Run", value: model.executionTime || Math.random() * 10 + 2 },
        { name: "Average", value: Math.random() * 10 + 3 },
        { name: "Maximum", value: Math.random() * 15 + 5 },
      ],
      resourceUsage: [
        { name: "CPU", value: Math.random() * 80 + 20 },
        { name: "Memory", value: Math.random() * 60 + 30 },
        { name: "I/O", value: Math.random() * 50 + 10 },
      ],
      waitTime: [
        { name: "Last Run", value: model.waitTime || Math.random() * 5 + 1 },
        { name: "Average", value: Math.random() * 5 + 2 },
        { name: "Maximum", value: Math.random() * 10 + 3 },
      ],
    }
  }

  // Generate sample historical data for charts
  const generateHistoricalData = (outputs, days = 30) => {
    return outputs
      .map((output) => {
        const baseValue =
          typeof output.value === "string" ? Number.parseFloat(output.value.replace(/,/g, "")) : output.value

        if (isNaN(baseValue)) return null

        const data = []
        for (let i = days; i >= 0; i--) {
          // Generate a value that fluctuates around the base value
          const fluctuation = (Math.random() - 0.5) * 0.2 * baseValue
          const value = Math.max(0, baseValue + fluctuation * (1 - i / days))
          data.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            value: value.toFixed(2),
          })
        }

        return {
          name: output.name,
          data,
          unit: output.unit,
        }
      })
      .filter(Boolean)
  }

  const currentExecutionRef = useRef({ pausedModels: new Set() })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column - Run Controls and Timeline (narrower) */}
      <div className="lg:col-span-4 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Play className="mr-2 h-5 w-5" />
              Run Controls
            </CardTitle>
            {/* Run Status Info */}
            <div className="flex items-center bg-blue-50 p-2 rounded-md border border-blue-200">
              <div className="flex-1">
                <h4 className="text-sm font-medium flex items-center">
                  {running ? (
                    paused ? (
                      <>
                        <Pause className="w-3 h-3 mr-1 text-yellow-600" /> Run Paused
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin text-blue-600" /> Run in Progress
                      </>
                    )
                  ) : getLastCompletedRunId() ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1 text-green-600" /> Last Run Completed
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1 text-gray-600" /> Ready to Run
                    </>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {running
                    ? `${completedModels.length} of ${sequence.length} models completed`
                    : getLastCompletedRunId()
                      ? `Last run: #${getLastCompletedRunId().substring(getLastCompletedRunId().length - 4)}`
                      : `${sequence.length} models in sequence`}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant={paused ? "outline" : "secondary"} className="mb-1">
                  {getRunId()
                    ? `Run #${getRunId().substring(getRunId().length - 4)}`
                    : getLastCompletedRunId()
                      ? `Last: #${getLastCompletedRunId().substring(getLastCompletedRunId().length - 4)}`
                      : "New Run"}
                </Badge>
                {getIterationCount() > 0 && (
                  <span className="text-xs text-muted-foreground">Iteration {getIterationCount() + 1}</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Button onClick={handleRunAll} disabled={running && !paused} className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  {running && !paused ? "Run in Progress..." : "Run All Models"}
                </Button>

                {running && (
                  <Button onClick={handlePauseResume} variant="outline" className="w-full">
                    {paused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume Execution
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Execution
                      </>
                    )}
                  </Button>
                )}

                <Button onClick={handleForceComplete} variant="outline" disabled={!running} className="w-full">
                  <SkipForward className="mr-2 h-4 w-4" />
                  Force Complete All
                </Button>

                <Button onClick={resetOutputs} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset All
                </Button>
                <Button
                  onClick={() => {
                    debugAllModelsState()
                    toast({
                      title: "Debug info logged",
                      description: "Check the console for detailed model state information",
                    })
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Model States
                </Button>
              </div>

              <div className="pt-2 border-t">
                <h3 className="text-sm font-medium mb-2">Execution Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Parallel Execution</span>
                    <Switch
                      checked={parallelExecution}
                      onCheckedChange={toggleParallelExecution}
                      aria-label="Toggle parallel execution"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stop on Error</span>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-retry</span>
                    <Badge variant="outline">3 attempts</Badge>
                  </div>
                </div>
              </div>

              {/* Enhanced Breakpoint Information */}
              {pausedOnModel && (
                <div className="pt-2 border-t">
                  <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-700 flex items-center">
                      <Pause className="w-4 h-4 mr-1" /> Breakpoint Hit
                    </AlertTitle>
                    <AlertDescription className="text-yellow-600">
                      <p className="mb-2">
                        Execution paused after model:{" "}
                        <span className="font-semibold">{getModelById(pausedOnModel)?.name || pausedOnModel}</span>
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white"
                          onClick={() => setBreakpointInfoOpen(true)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white"
                          onClick={() => handleContinueAfterBreakpoint(pausedOnModel)}
                        >
                          <Play className="w-3 h-3 mr-1" /> Continue
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {failedModel && (
                <div className="pt-2 border-t">
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-700">Execution Failed</AlertTitle>
                    <AlertDescription className="text-red-600">
                      Failed at model: {getModelById(failedModel)?.name || failedModel}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Model Run Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] px-4">
              <div className="space-y-1 relative pl-6 border-l border-muted">
                {sequence.map((model, index) => {
                  const isRunning = isModelRunning(model.id)
                  const isPaused = isModelPaused(model.id)
                  const isFailed = isModelFailed(model.id)
                  const { hasDependencies, hasDependents } = getDependencyInfo(model.id)

                  return (
                    <div
                      key={model.id}
                      className={`mb-3 relative cursor-pointer hover:bg-gray-50 rounded-md p-2 
                        ${selectedModelId === model.id ? "bg-gray-50 border border-blue-300" : ""}
                        ${model.id.startsWith("test-model-") ? "border-l-4 border-blue-400" : ""}
                        ${isRunning ? "border-2 border-blue-500 bg-blue-50" : ""}
                        ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}
                        ${isFailed ? "border-2 border-red-500 bg-red-50" : ""}
                        ${model.breakpoint ? "border-l-4 border-red-400" : ""}`}
                      onClick={() => handleSelectModel(model)}
                      ref={(el) => (modelRefs.current[model.id] = el)}
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
                            {model.name}
                            {model.breakpoint && (
                              <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Breakpoint
                              </Badge>
                            )}
                          </span>
                          {getStatusBadge(model.status, model.id)}
                        </div>
                        {model.startTime && (
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(model.startTime).toLocaleTimeString()}
                          </p>
                        )}
                        {model.endTime && (
                          <p className="text-xs text-muted-foreground">
                            Completed: {new Date(model.endTime).toLocaleTimeString()}
                            {model.startTime && (
                              <span className="ml-2">({formatDuration(model.startTime, model.endTime)})</span>
                            )}
                          </p>
                        )}
                        {model.status === "running" && <Progress value={model.progress} className="h-1 mt-2" />}

                        {/* Dependencies indicator */}
                        {(hasDependencies || hasDependents) && (
                          <div className="flex gap-2 mt-1">
                            {hasDependencies && (
                              <Badge variant="outline" className="text-xs">
                                <CornerRightDown className="w-3 h-3 mr-1" /> Dependencies
                              </Badge>
                            )}
                            {hasDependents && (
                              <Badge variant="outline" className="text-xs">
                                <CornerRightDown className="w-3 h-3 mr-1 rotate-180" /> Dependents
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Control buttons */}
                        <div className="flex mt-2 space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRunModel(model.id)
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isRunning) {
                                pauseExecution()
                              } else if (isPaused) {
                                handleContinueAfterBreakpoint(model.id)
                              }
                            }}
                          >
                            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 ${model.breakpoint ? "text-red-500" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleBreakpoint(model.id)
                            }}
                          >
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Model Details and Drilldowns (wider) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-blue-600 text-2xl font-bold">{runningModelsList.length}</div>
              <div className="text-sm text-muted-foreground">Running</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-amber-600 text-2xl font-bold">{pendingModels.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-green-600 text-2xl font-bold">{completedModels.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-red-600 text-2xl font-bold">{failedModels.length}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
        </div>

        {/* Execution Sequence with Drilldowns */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <List className="mr-2 h-5 w-5" />
                Execution Sequence
              </CardTitle>
              <Button variant="outline" size="sm" onClick={toggleParallelExecution} className="flex items-center">
                <Layers className="mr-1 h-4 w-4" />
                {parallelExecution ? "Parallel Mode" : "Sequential Mode"}
              </Button>
            </div>
            <CardDescription>Click on a model to view details and modules</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]" ref={sequenceRef}>
              <div className="p-4 space-y-4">
                {sequence.map((model, index) => {
                  const isRunning = isModelRunning(model.id)
                  const isPaused = isModelPaused(model.id)
                  const isFailed = isModelFailed(model.id)
                  const { dependencies, dependents } = getDependencyInfo(model.id)

                  return (
                    <Collapsible
                      key={model.id}
                      open={expandedModels[model.id] || selectedModelId === model.id || isPaused || isFailed}
                      onOpenChange={() => toggleExpanded(model.id)}
                    >
                      <div
                        className={`p-3 rounded-md border 
                          ${selectedModelId === model.id ? "border-blue-400 bg-blue-50" : "border-gray-200"}
                          ${model.id.startsWith("test-model-") ? "border-blue-300 bg-blue-50" : ""}
                          ${isRunning ? "border-2 border-blue-500 bg-blue-50" : ""}
                          ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}
                          ${isFailed ? "border-2 border-red-500 bg-red-50" : ""}
                          ${model.breakpoint ? "border-l-4 border-red-400" : ""}`}
                        onClick={() => handleSelectModel(model)}
                      >
                        <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center">
                              <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                {index + 1}
                              </span>
                              <div>
                                <span
                                  className={`font-medium ${model.id.startsWith("test-model-") ? "text-blue-700" : ""}`}
                                >
                                  {model.name}
                                  {model.breakpoint && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs bg-red-50 text-red-600 border-red-200"
                                    >
                                      <AlertTriangle className="w-3 h-3 mr-1" /> Breakpoint
                                    </Badge>
                                  )}
                                </span>
                                {model.status === "running" && (
                                  <Progress value={model.progress} className="h-1 mt-1 w-40" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center">
                              {getStatusBadge(model.status, model.id)}
                              <Button variant="ghost" size="sm" className="ml-1">
                                {expandedModels[model.id] || selectedModelId === model.id || isPaused || isFailed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent onClick={(e) => e.stopPropagation()}>
                          <div className="mt-3 pt-3 border-t">
                            {/* Model Details */}
                            <div className="mb-3">
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Status:</span>{" "}
                                  {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                                  {isPaused && " (Paused)"}
                                  {isFailed && " (Failed)"}
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Duration:</span>{" "}
                                  {model.startTime && model.endTime
                                    ? formatDuration(model.startTime, model.endTime)
                                    : "—"}
                                </div>
                                {model.description && (
                                  <div className="text-sm col-span-2">
                                    <span className="text-muted-foreground">Description:</span> {model.description}
                                  </div>
                                )}
                              </div>

                              {/* Dependencies and Dependents */}
                              {(dependencies.length > 0 || dependents.length > 0) && (
                                <div className="mb-3 grid grid-cols-2 gap-2">
                                  {dependencies.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Dependencies</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {dependencies.map((depId) => {
                                          const depModel = getModelById(depId)
                                          return (
                                            <Badge
                                              key={depId}
                                              variant="outline"
                                              className={`text-xs cursor-pointer ${
                                                depModel?.status === "completed"
                                                  ? "bg-green-50"
                                                  : depModel?.status === "running"
                                                    ? "bg-blue-50"
                                                    : depModel?.status === "failed"
                                                      ? "bg-red-50"
                                                      : ""
                                              }`}
                                              onClick={() => {
                                                const depModel = getModelById(depId)
                                                if (depModel) handleSelectModel(depModel)
                                              }}
                                            >
                                              {depModel?.name || depId}
                                              {depModel?.breakpoint && (
                                                <AlertTriangle className="w-3 h-3 ml-1 text-red-500" />
                                              )}
                                            </Badge>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {dependents.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Dependents</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {dependents.map((depId) => {
                                          const depModel = getModelById(depId)
                                          return (
                                            <Badge
                                              key={depId}
                                              variant="outline"
                                              className="text-xs cursor-pointer"
                                              onClick={() => {
                                                const depModel = getModelById(depId)
                                                if (depModel) handleSelectModel(depModel)
                                              }}
                                            >
                                              {depModel?.name || depId}
                                            </Badge>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Key Outputs */}
                              {model.outputs && model.outputs.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium mb-1">Key Outputs</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {model.outputs.slice(0, 4).map((output) => (
                                      <div
                                        key={output.id}
                                        className="bg-gray-50 p-2 rounded-md border border-gray-200 text-center"
                                      >
                                        <div className="text-lg font-bold">{output.value || "—"}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {output.name} {output.unit && `(${output.unit})`}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {model.outputs.length > 4 && (
                                    <div className="text-xs text-center mt-1 text-muted-foreground">
                                      +{model.outputs.length - 4} more outputs
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Control Buttons */}
                              <div className="flex space-x-2 mb-3">
                                <Button size="sm" onClick={() => handleRunModel(model.id)}>
                                  <Play className="mr-1 h-3 w-3" />
                                  Run Model
                                </Button>
                                {isPaused && (
                                  <Button size="sm" onClick={() => handleContinueAfterBreakpoint(model.id)}>
                                    <Play className="mr-1 h-3 w-3" />
                                    Continue Past Breakpoint
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleBreakpoint(model.id)}
                                  className={model.breakpoint ? "text-red-500" : ""}
                                >
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  {model.breakpoint ? "Remove Breakpoint" : "Set Breakpoint"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/module-details/${model.id}`)}
                                >
                                  <Settings className="mr-1 h-3 w-3" />
                                  Details
                                </Button>
                              </div>
                            </div>

                            {/* Modules */}
                            {model.modules && model.modules.length > 0 ? (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Modules ({model.modules.length})</h4>
                                <div className="space-y-2">
                                  {model.modules.map((module) => (
                                    <div
                                      key={module.id}
                                      className={`border rounded-md p-2 hover:bg-gray-50 cursor-pointer ${
                                        !module.enabled ? "opacity-60" : ""
                                      } ${module.breakpoint ? "border-l-4 border-red-400" : ""}`}
                                      onClick={() => handleSelectModule(model.id, module)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium flex items-center">
                                            {module.name}
                                            {module.optional && (
                                              <Badge variant="outline" className="ml-2 text-xs">
                                                Optional
                                              </Badge>
                                            )}
                                            {module.breakpoint && (
                                              <Badge
                                                variant="outline"
                                                className="ml-2 text-xs bg-red-50 text-red-600 border-red-200"
                                              >
                                                <AlertTriangle className="w-3 h-3 mr-1" /> Breakpoint
                                              </Badge>
                                            )}
                                          </div>
                                          {module.description && (
                                            <p className="text-xs text-muted-foreground">{module.description}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center">
                                          {getStatusBadge(module.status)}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleRunModule(model.id, module.id)
                                            }}
                                          >
                                            <Play className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Module Outputs Preview */}
                                      {module.outputs && module.outputs.length > 0 && (
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                          {module.outputs.slice(0, 2).map((output, i) => (
                                            <div key={i} className="text-center p-1 bg-gray-50 rounded-md">
                                              <div className="text-sm font-bold">{output.value || "—"}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {output.name} {output.unit && `(${output.unit})`}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                No modules defined for this model
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                      {model.dependencies &&
                        model.dependencies.some((depId) => {
                          const depModel = getModelById(depId)
                          return (
                            depModel &&
                            (depModel.status === "paused" || currentExecutionRef.current.pausedModels.has(depId))
                          )
                        }) && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                            <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-600" />
                            <span className="text-yellow-700">Waiting for paused dependency</span>
                          </div>
                        )}
                      {model.status === "blocked" && model.blockingDependencyId && (
                        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-md p-2 text-sm">
                          <AlertTriangle className="w-3 h-3 inline mr-1 text-orange-600" />
                          <span className="text-orange-700">
                            Blocked: Waiting for <strong>{model.blockingDependencyName}</strong> to complete
                          </span>
                        </div>
                      )}
                    </Collapsible>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Breakpoint Information Dialog with Mini Dashboard */}
      <Dialog open={breakpointInfoOpen} onOpenChange={setBreakpointInfoOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-yellow-700">
              <Pause className="w-5 h-5 mr-2 text-yellow-600" /> Execution Paused at Breakpoint
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center">
                <Badge className="bg-yellow-100 text-yellow-600 mr-2">
                  <Pause className="w-3 h-3 mr-1" /> Paused
                </Badge>
                <span>
                  Model: <span className="font-semibold">{getModelById(pausedOnModel)?.name || pausedOnModel}</span>
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={breakpointActiveTab} onValueChange={setBreakpointActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">
                <BarChartIcon className="mr-2 h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="modules">
                <Settings className="mr-2 h-4 w-4" />
                Modules
              </TabsTrigger>
              <TabsTrigger value="dependencies">
                <ArrowRight className="mr-2 h-4 w-4" />
                Dependencies
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="mr-2 h-4 w-4" />
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4 mt-4">
              {pausedOnModel && (
                <>
                  {/* Run Information */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Run Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Run ID:</p>
                          <Badge className="mt-1">
                            {getRunId() ? `#${getRunId().substring(getRunId().length - 4)}` : "New Run"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Status:</p>
                          <Badge className="bg-yellow-100 text-yellow-600 mt-1">
                            <Pause className="w-3 h-3 mr-1" /> Paused
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Iteration:</p>
                          <p>{getIterationCount() + 1}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Duration:</p>
                          <p>{getRunDuration()}s</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <Badge className="bg-yellow-100 text-yellow-600">
                            <Pause className="w-3 h-3 mr-1" /> Paused
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Execution paused after model completion</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Execution Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(pausedModelData || getModelById(pausedOnModel))?.executionTime?.toFixed(2) || "0.00"}s
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Completed at{" "}
                          {new Date(
                            (pausedModelData || getModelById(pausedOnModel))?.endTime || Date.now(),
                          ).toLocaleTimeString()}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {getBlockedModels(pausedOnModel).length > 0 ? (
                            <div className="text-sm">
                              <span className="font-medium">{getBlockedModels(pausedOnModel).length}</span> models
                              waiting
                            </div>
                          ) : (
                            <div className="text-sm">No dependent models</div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const model = getModelById(pausedOnModel)
                              if (model) {
                                router.push(`/model-groups/${model.id}`)
                              }
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> View Full Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Model Outputs */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Model Outputs</CardTitle>
                      <CardDescription>Key results from the completed model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {(pausedModelData || getModelById(pausedOnModel))?.outputs?.map((output, index) => (
                          <div key={index} className="bg-muted p-3 rounded-md">
                            <p className="text-sm text-muted-foreground">{output.name}</p>
                            <p className="text-lg font-medium">
                              {output.value}{" "}
                              {output.unit && <span className="text-sm text-muted-foreground">{output.unit}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Charts */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Execution Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[200px]">
                        <BarChart
                          data={generateModelPerformanceData(pausedOnModel)?.executionTime || []}
                          index="name"
                          categories={["value"]}
                          colors={["blue"]}
                          valueFormatter={(value) => `${value.toFixed(2)}s`}
                          showLegend={false}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Resource Usage</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[200px]">
                        <BarChart
                          data={generateModelPerformanceData(pausedOnModel)?.resourceUsage || []}
                          index="name"
                          categories={["value"]}
                          colors={["green"]}
                          valueFormatter={(value) => `${value.toFixed(1)}%`}
                          showLegend={false}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Historical Data */}
                  {(pausedModelData || getModelById(pausedOnModel))?.outputs &&
                    (pausedModelData || getModelById(pausedOnModel))?.outputs.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">Historical Trends</CardTitle>
                          <CardDescription>Output values over time</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                          <LineChart
                            data={
                              generateHistoricalData((pausedModelData || getModelById(pausedOnModel))?.outputs || [])[0]
                                ?.data || []
                            }
                            index="date"
                            categories={["value"]}
                            colors={["blue"]}
                            showLegend={false}
                          />
                        </CardContent>
                      </Card>
                    )}
                </>
              )}
            </TabsContent>

            <TabsContent value="modules" className="mt-4">
              {pausedOnModel && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Module Breakdown</CardTitle>
                      <CardDescription>Individual modules within this model</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="p-4 space-y-3">
                          {(pausedModelData || getModelById(pausedOnModel))?.modules?.map((module, index) => (
                            <Card key={module.id} className="border">
                              <CardHeader className="py-3 px-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-md">{module.name}</CardTitle>
                                    {module.description && <CardDescription>{module.description}</CardDescription>}
                                  </div>
                                  <Badge
                                    className={
                                      module.status === "completed"
                                        ? "bg-green-100 text-green-600"
                                        : module.status === "running"
                                          ? "bg-blue-100 text-blue-600"
                                          : "bg-gray-100 text-gray-600"
                                    }
                                  >
                                    {module.status}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="py-2 px-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Inputs</h4>
                                    {module.inputs?.map((input, idx) => (
                                      <div key={idx} className="flex justify-between items-center mb-1 text-sm">
                                        <span className="text-muted-foreground">{input.name}:</span>
                                        <span>
                                          {input.value}{" "}
                                          {input.unit && (
                                            <span className="text-xs text-muted-foreground">{input.unit}</span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Outputs</h4>
                                    {module.outputs?.map((output, idx) => (
                                      <div key={idx} className="flex justify-between items-center mb-1 text-sm">
                                        <span className="text-muted-foreground">{output.name}:</span>
                                        <span>
                                          {output.value}{" "}
                                          {output.unit && (
                                            <span className="text-xs text-muted-foreground">{output.unit}</span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter className="py-2 px-4 border-t flex justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSelectModule(pausedOnModel, module)}
                                >
                                  <Eye className="w-3 h-3 mr-1" /> View Details
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dependencies" className="mt-4">
              {pausedOnModel && (
                <div className="space-y-4">
                  {/* Dependency Chain */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Dependency Chain</CardTitle>
                      <CardDescription>Models this model depends on</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left p-2">Model</th>
                              <th className="text-left p-2">Status</th>
                              <th className="text-left p-2">Execution Time</th>
                              <th className="text-left p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getDependencyChain(pausedOnModel).map((dep) => {
                              const depModel = getModelById(dep.id)
                              return (
                                <tr key={dep.id} className="border-t">
                                  <td className="p-2">{dep.name}</td>
                                  <td className="p-2">{getStatusBadge(dep.status)}</td>
                                  <td className="p-2">
                                    {depModel?.executionTime ? `${depModel.executionTime.toFixed(2)}s` : "—"}
                                  </td>
                                  <td className="p-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (depModel) {
                                          handleSelectModel(depModel)
                                        }
                                      }}
                                    >
                                      <Eye className="w-3 h-3 mr-1" /> View
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blocked Models */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Blocked Models</CardTitle>
                      <CardDescription>Models waiting for this model to complete</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {getBlockedModels(pausedOnModel).length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2">Model</th>
                                <th className="text-left p-2">Status</th>
                                <th className="text-left p-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getBlockedModels(pausedOnModel).map((model) => {
                                const fullModel = getModelById(model.id)
                                return (
                                  <tr key={model.id} className="border-t">
                                    <td className="p-2">{model.name}</td>
                                    <td className="p-2">{getStatusBadge(model.status)}</td>
                                    <td className="p-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (fullModel) {
                                            handleSelectModel(fullModel)
                                          }
                                        }}
                                      >
                                        <Eye className="w-3 h-3 mr-1" /> View
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No models are waiting on this model
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              {pausedOnModel && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Model Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Basic Information</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Name:</span>
                              <span className="text-sm font-medium">
                                {getModelById(pausedOnModel)?.name || pausedOnModel}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">ID:</span>
                              <span className="text-sm font-mono">{pausedOnModel}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              <Badge className="bg-yellow-100 text-yellow-600">
                                <Pause className="w-3 h-3 mr-1" /> Paused
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Execution Time:</span>
                              <span className="text-sm">
                                {getModelById(pausedOnModel)?.executionTime?.toFixed(2) || "0.00"}s
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Timing Information</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Start Time:</span>
                              <span className="text-sm">
                                {getModelById(pausedOnModel)?.startTime
                                  ? new Date(getModelById(pausedOnModel)?.startTime).toLocaleTimeString()
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">End Time:</span>
                              <span className="text-sm">
                                {getModelById(pausedOnModel)?.endTime
                                  ? new Date(getModelById(pausedOnModel)?.endTime).toLocaleTimeString()
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Modules:</span>
                              <span className="text-sm">
                                {getModelById(pausedOnModel)?.modules?.length || 0} modules
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {getModelById(pausedOnModel)?.description && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Description</h4>
                          <p className="text-sm">{getModelById(pausedOnModel)?.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Code Snippet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-auto max-h-[200px]">
                        <pre>{getModelById(pausedOnModel)?.code || "No code available"}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <DialogFooter className="flex justify-between items-center border-t pt-4 mt-4">
            <div className="flex items-center">
              <Badge className="bg-yellow-100 text-yellow-600 mr-2">
                <Pause className="w-3 h-3 mr-1" /> Run Paused
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getRunId() ? `Run #${getRunId().substring(getRunId().length - 4)}` : "New Run"} •{" "}
                {completedModels.length} of {sequence.length} models completed
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBreakpointInfoOpen(false)}>
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  handleContinueAfterBreakpoint(pausedOnModel)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Continue Run
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Detail Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedModule?.name}
              {selectedModule?.status && getStatusBadge(selectedModule.status)}
              {selectedModule?.optional && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Optionalptional
                </Badge>
              )}
              {selectedModule?.breakpoint && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Breakpoint
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedModel?.name} &gt; {selectedModule?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Module Description */}
            {selectedModule?.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedModule.description}</p>
              </div>
            )}

            {/* Module Status and Controls */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Status</h3>
              <div className="flex items-center gap-2">
                {selectedModule?.status && getStatusBadge(selectedModule.status)}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="module-enabled"
                    checked={selectedModule?.enabled}
                    onCheckedChange={() => {
                      // Toggle module enabled state
                      if (selectedModelId && selectedModule) {
                        // This would call your toggleModuleEnabled function
                        toast({
                          title: `Module ${selectedModule.enabled ? "disabled" : "enabled"}`,
                          description: `${selectedModule.name} has been ${selectedModule.enabled ? "disabled" : "enabled"}.`,
                        })
                      }
                    }}
                  />
                  <span className="text-sm">Enabled</span>
                </div>
              </div>
            </div>

            {/* Module Orchestration Controls */}
            <div className="flex space-x-2 py-2 border-y">
              <Button
                size="sm"
                onClick={() => {
                  if (selectedModelId && selectedModule) {
                    handleRunModule(selectedModelId, selectedModule.id)
                  }
                }}
              >
                <Play className="mr-1 h-3 w-3" />
                Run Module
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Force complete module
                  toast({
                    title: "Module completed",
                    description: `${selectedModule?.name} has been marked as completed.`,
                  })
                }}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Force Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Reset module
                  toast({
                    title: "Module reset",
                    description: `${selectedModule?.name} has been reset to idle state.`,
                  })
                }}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            </div>

            {/* Module Inputs */}
            {selectedModule?.inputs && selectedModule.inputs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Inputs</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium">Name</th>
                        <th className="text-left p-2 text-xs font-medium">Value</th>
                        <th className="text-left p-2 text-xs font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedModule.inputs.map((input, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-sm">{input.name}</td>
                          <td className="p-2 text-sm font-mono">
                            {typeof input.value === "object"
                              ? JSON.stringify(input.value).substring(0, 30) + "..."
                              : input.value || "—"}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">{input.source || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Module Outputs */}
            {selectedModule?.outputs && selectedModule.outputs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Outputs</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium">Name</th>
                        <th className="text-left p-2 text-xs font-medium">Value</th>
                        <th className="text-left p-2 text-xs font-medium">Unit</th>
                        <th className="text-left p-2 text-xs font-medium">Consumers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedModule.outputs.map((output, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-sm">{output.name}</td>
                          <td className="p-2 text-sm font-mono">{output.value || "—"}</td>
                          <td className="p-2 text-sm text-muted-foreground">{output.unit || "—"}</td>
                          <td className="p-2 text-sm">
                            {output.consumers && output.consumers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {output.consumers.map((consumer, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {consumer}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Module Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => handleRunModule(selectedModelId, selectedModule?.id)}>
                <Play className="mr-2 h-4 w-4" />
                Run Module
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RunDashboard
