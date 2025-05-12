"use client"

import { useState, useRef, useEffect } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Eye,
  ArrowRight,
  BarChartIcon,
  FileText,
  ExternalLink,
  Zap,
  FileCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { LineChart, BarChart } from "@/components/ui/chart"
import { EnhancedExecutionSequence } from "./enhanced-execution-sequence"
import { ModelRunTimeline } from "./model-run-timeline"
import { Sliders, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

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
    verifyRunCompletionStatus,
    isModelFrozen,
    isDormant, // Add this
    forceDormantState,
    completeAllExecution,
    simulationState,
  } = useModelState()

  // Add this useEffect near the beginning of the component
  useEffect(() => {
    // Force a refresh when the component mounts to ensure models are displayed
    setRefreshKey((prev) => prev + 1)

    // Ensure we have a valid sequence even in dormant state
    if (sequence.length === 0) {
      console.log("RunDashboard: No models in sequence, forcing refresh")
      setTimeout(() => setRefreshKey((prev) => prev + 1), 100)
    }
  }, [])

  // Add this useEffect near the beginning of the component
  useEffect(() => {
    console.log("RunDashboard initializing, ensuring run state is consistent")

    // Force a one-time check for inconsistent state
    const oneTimeCheck = () => {
      if (running) {
        const allCompleted = sequence.every(
          (model) =>
            model.status === "completed" || !model.enabled || model.status === "disabled" || isModelFrozen(model.id),
        )

        if (allCompleted) {
          console.log("Initial check: All models completed but run still active - forcing dormant state")
          forceDormantState()
        }
      }
    }

    // Run the check after a short delay to ensure all state is loaded
    setTimeout(oneTimeCheck, 100)

    // Remove any DOM attributes that might be causing issues
    document.documentElement.removeAttribute("data-simulation-running")
    document.documentElement.removeAttribute("data-breakpoint-active")

    return () => {
      // Clean up on unmount
      document.documentElement.removeAttribute("data-simulation-running")
      document.documentElement.removeAttribute("data-breakpoint-active")
    }
  }, []) // Empty dependency array ensures this only runs once on mount

  // Add a one-time initialization check on component mount
  useEffect(() => {
    console.log("RunDashboard initializing, ensuring run state is consistent")

    // If everything appears to be completed but run still shows as running, make it dormant
    if (running) {
      const allCompleted = sequence.every(
        (model) =>
          model.status === "completed" || !model.enabled || model.status === "disabled" || isModelFrozen(model.id),
      )

      if (allCompleted) {
        console.log("Initial check: All models completed but run still active - forcing dormant state")
        verifyRunCompletionStatus()
      }
    }

    // Force component to use cached sequence after initial render
    setRefreshKey((prev) => prev + 1)
  }, []) // Empty dependency array ensures this only runs once on mount

  const router = useRouter()
  const { toast } = useToast()
  const [selectedModel, setSelectedModel] = useState(null)
  const [expandedModels, setExpandedModels] = useState({})
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(null)
  // Single source of truth for parallelExecution
  const [parallelExecution, setParallelExecution] = useState(true) // Default to true for parallel execution
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

  // Toggle parallel execution mode - single function to handle both toggles
  const toggleParallelExecution = () => {
    setParallelExecution(!parallelExecution)
    toast({
      title: `${!parallelExecution ? "Parallel" : "Sequential"} execution enabled`,
      description: `Models will now run in ${!parallelExecution ? "parallel" : "sequential"} mode.`,
    })
  }

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
    if (pausedOnModel && !breakpointInfoOpen) {
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
        // Only open if not already open
        if (!breakpointInfoOpen) {
          setTimeout(() => {
            setBreakpointInfoOpen(true)
          }, 200)
        }
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
  }, [pausedOnModel, failedModel, getModelById, breakpointInfoOpen])

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

    // Close the dialog first to prevent multiple dialogs
    setBreakpointInfoOpen(false)

    // Wait a moment to ensure UI updates before continuing
    setTimeout(() => {
      // Make sure we're still in a running state
      if (isSimulationRunning()) {
        continueAfterBreakpoint(modelId)

        toast({
          title: "Continuing execution",
          description: `Execution will continue from model ${getModelById(modelId)?.name || modelId}`,
        })

        // Force refresh to update UI
        setRefreshKey((prev) => prev + 1)
      } else {
        // If simulation is no longer running, inform the user
        toast({
          title: "Cannot continue execution",
          description: "The simulation is no longer running. Please start a new run.",
          variant: "destructive",
        })
      }
    }, 300)
  }

  // Handle force complete all
  const handleForceComplete = () => {
    forceCompleteAllRunning()

    // After forcing completion, check if the run should be completed
    setTimeout(() => {
      verifyRunCompletionStatus()
    }, 100)

    toast({
      title: "Force completed all running models",
      description: "All running models and modules have been marked as completed.",
    })
  }

  // Handle model selection for details view
  const handleSelectModel = (model) => {
    // Navigate to the model details page
    router.push(`/model-groups/${model.id}`)
  }

  // Handle module selection for details dialog
  const handleSelectModule = (modelId, module) => {
    // Navigate to the module details page
    router.push(`/module-details/${module.id}`)
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
      case "blocked":
        return (
          <Badge className="bg-orange-100 text-orange-600">
            <Clock className="w-3 h-3 mr-1" /> Waiting for Dependency
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

  // Add a dedicated function to generate a breakpoint badge for models
  // Add this function after the getStatusBadge function:

  // Get breakpoint badge for a model
  const getBreakpointBadge = (modelId) => {
    const model = getModelById(modelId)
    if (!model || !model.breakpoint) return null

    return (
      <Badge className="bg-red-100 text-red-600 border border-red-300">
        <AlertCircle className="w-3 h-3 mr-1" /> Breakpoint
      </Badge>
    )
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

  // Add a useEffect to force refresh both views when a model is selected
  // This ensures that when a model is clicked in the timeline, both views show consistent data

  // Add this after the other useEffect hooks
  useEffect(() => {
    // Force refresh both views when a model is selected to ensure consistency
    if (selectedModelId) {
      // Force refresh the execution sequence
      setRefreshKey((prev) => prev + 1)

      // Ensure we're using the latest model data
      const latestModel = modelGroups.find((m) => m.id === selectedModelId)
      if (latestModel) {
        setSelectedModel(latestModel)
      }
    }
  }, [selectedModelId, modelGroups])

  // Check for completion when the component mounts or when the sequence changes
  useEffect(() => {
    // Only run this check if the simulation is running and not dormant
    if (running && !isDormant()) {
      const pendingCount = sequence.filter((model) => model.status === "idle").length
      const runningCount = sequence.filter((model) => model.status === "running").length
      const completedCount = sequence.filter((model) => model.status === "completed").length

      // If all models are completed but the run is still marked as running, verify completion status
      if (pendingCount === 0 && runningCount === 0 && completedCount === sequence.length) {
        console.log("Initial check: All models appear to be completed, verifying run completion status")
        verifyRunCompletionStatus()
      }
    }
  }, [running, sequence, verifyRunCompletionStatus, isDormant])

  // Add a useEffect to verify run completion status when component mounts or updates

  // Find the last useEffect in the file and add this new useEffect after it:

  // Add this after the other useEffect hooks
  useEffect(() => {
    // Check if all models are completed but the run is still marked as running
    if (running && sequence.length > 0 && !isDormant()) {
      const allCompleted = sequence.every(
        (model) =>
          model.status === "completed" || !model.enabled || model.status === "disabled" || isModelFrozen(model.id),
      )

      if (allCompleted) {
        console.log("Dashboard detected all models completed but run still marked as running")
        // Force verification of run completion status
        verifyRunCompletionStatus()
      }
    }
  }, [running, sequence, verifyRunCompletionStatus, isModelFrozen, isDormant])

  // Add this useEffect to ensure the running state is updated when all models complete
  useEffect(() => {
    // If all models are completed but the run is still marked as running
    if (running && sequence.length > 0 && !isDormant()) {
      const allCompleted = sequence.every(
        (model) =>
          model.status === "completed" || !model.enabled || model.status === "disabled" || isModelFrozen(model.id),
      )

      if (allCompleted) {
        console.log("All models completed, forcing run completion check")
        verifyRunCompletionStatus()
      }
    }
  }, [sequence, running, verifyRunCompletionStatus, isModelFrozen, isDormant])

  // Add a new useEffect that specifically checks the DOM attribute
  // and forces a state update if needed
  useEffect(() => {
    // Don't check for inconsistencies in dormant state
    if (isDormant()) return

    // Check for inconsistency between DOM attribute and React state
    const isRunningInDOM = document.documentElement.getAttribute("data-simulation-running") === "true"

    if (!isRunningInDOM && running) {
      console.log("Detected inconsistency: DOM says not running but state says running")
      // Force state update to match DOM
      setRefreshKey((prev) => prev + 1)
    } else if (isRunningInDOM && !running) {
      console.log("Detected inconsistency: DOM says running but state says not running")
      // Force state update to match DOM
      setRefreshKey((prev) => prev + 1)
    }
  }, [running, refreshKey, isDormant])

  // Add another useEffect that runs a completion check on a timer
  useEffect(() => {
    if (running && !isDormant()) {
      const checkInterval = setInterval(() => {
        // Count completed models
        const completedCount = sequence.filter(
          (model) => model.status === "completed" || isModelFrozen(model.id) || !model.enabled,
        ).length

        // If all models are completed but run still shows as running
        if (completedCount === sequence.length) {
          console.log("Timer detected all models completed, forcing verification")
          verifyRunCompletionStatus()
        }
      }, 1000) // Check every second

      return () => clearInterval(checkInterval)
    }
  }, [running, sequence, verifyRunCompletionStatus, isModelFrozen, isDormant])

  // Add a new useEffect that runs a more aggressive check for completion
  useEffect(() => {
    // Only run if not already in dormant state
    if (running && !isDormant()) {
      // Check if all models are completed
      const allCompleted = sequence.every(
        (model) =>
          model.status === "completed" || !model.enabled || model.status === "disabled" || isModelFrozen(model.id),
      )

      if (allCompleted) {
        console.log("All models are completed - forcing complete execution stop")
        completeAllExecution()
      }
    }
  }, [running, sequence, isDormant, completeAllExecution, isModelFrozen])

  const handleReset = () => {
    console.log("Initiating complete reset of all models and state")

    // First force complete stop of all execution
    completeAllExecution()

    // Then reset outputs with a slight delay to ensure clean state
    setTimeout(() => {
      resetOutputs()

      toast({
        title: "Reset complete",
        description: "All models and state have been reset to initial values.",
      })

      // Force refresh to update UI
      setRefreshKey((prev) => prev + 1)
    }, 100)
  }

  // Function to safely get run duration
  function getRunDurationSecs() {
    if (!simulationState || !simulationState.runStartTime) return 0

    // If the run is finalized, use the end time for a fixed duration
    if (simulationState.runState === "FINALIZED" && simulationState.runEndTime) {
      return Math.floor((simulationState.runEndTime - simulationState.runStartTime) / 1000)
    }

    // Otherwise, calculate the current duration
    return Math.floor((Date.now() - simulationState.runStartTime) / 1000)
  }

  // Check if run is finalized - safely access simulationState
  const isRunFinalized = simulationState && simulationState.runState === "FINALIZED"

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Model Run Timeline (narrower) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Model Run Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Model Run Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ModelRunTimeline parallelExecution={parallelExecution} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Model Details and Drilldowns (wider) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
            {isRunFinalized && (
              <Card className="col-span-4 bg-green-50 border-green-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileCheck className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <div className="font-medium text-green-700">Run Finalized and Signed Off</div>
                      <div className="text-sm text-green-600">
                        This run has been completed and signed off. Start a new run to make changes.
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-green-100 hover:bg-green-200 text-green-700 border-green-300"
                    onClick={() => resetOutputs()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start New Run
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Breakpoint Banner - Show when a breakpoint is hit */}
          {paused && pausedOnModel && (
            <Card className="mb-6 bg-amber-50 border-amber-300 shadow-md overflow-hidden">
              <div className="border-l-4 border-amber-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-amber-100 p-2 rounded-full mr-4">
                      <Pause className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-800">Execution Paused at Breakpoint</h3>
                      <p className="text-amber-700">
                        Run ID #{getRunId()?.substring(0, 8)} is paused at model:{" "}
                        <span className="font-medium">{getModelById(pausedOnModel)?.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => continueAfterBreakpoint(pausedOnModel)}
                      className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Resume Run #{getRunId()?.substring(0, 4)}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBreakpointInfoOpen(true)}
                      className="border-amber-400 text-amber-700 hover:bg-amber-100"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Breakpoint Options
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          )}

          {/* Enhanced Execution Sequence with shared parallelExecution state */}
          <EnhancedExecutionSequence
            parallelExecution={parallelExecution}
            onToggleParallelExecution={toggleParallelExecution}
            onContinueAfterBreakpoint={continueAfterBreakpoint}
          />

          {/* Replace the existing Run All button with this improved version */}
          <div className="flex gap-2 w-full">
            {paused && pausedOnModel ? (
              <>
                <Button
                  onClick={() => continueAfterBreakpoint(pausedOnModel)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume Run #{getRunId()?.substring(0, 4)}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBreakpointInfoOpen(true)}
                  className="border-amber-400 text-amber-700 hover:bg-amber-100"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Breakpoint Options
                </Button>
              </>
            ) : (
              <Button
                onClick={running ? handlePauseResume : handleRunAll}
                disabled={running && !paused}
                className="flex-1"
              >
                {running ? (
                  paused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume Execution
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Execution
                    </>
                  )
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run All Models
                  </>
                )}
              </Button>
            )}

            {/* Add Force Complete button when running */}
            {running && (
              <Button
                variant="outline"
                onClick={() => {
                  verifyRunCompletionStatus()
                  toast({
                    title: "Force completing run",
                    description: "Attempting to force complete the current run",
                  })
                }}
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Force Complete Run
              </Button>
            )}
            <Button variant="outline" onClick={handleReset} className="ml-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset All
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Breakpoint Information Dialog with Mini Dashboard */}
      <Dialog open={breakpointInfoOpen} onOpenChange={setBreakpointInfoOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-yellow-700">
              <Pause className="w-5 h-5 mr-2 text-yellow-600" />
              Run #{getRunId()?.substring(0, 8)} Paused at Breakpoint
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
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="adjustments">
                <Sliders className="mr-2 h-4 w-4" />
                Adjustments
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
                          <Badge className="mt-1">{getRunId() ? `#${getRunId()}` : "New Run"}</Badge>
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
                          <p>{getRunDurationSecs()}s</p>
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
                          <div key={index} className="bg-muted p-3 rounded-md relative group">
                            <p className="text-sm text-muted-foreground">{output.name}</p>
                            <p className="text-lg font-medium">
                              {output.value}{" "}
                              {output.unit && <span className="text-sm text-muted-foreground">{output.unit}</span>}
                            </p>
                            <div className="absolute inset-0 bg-blue-100 opacity-0 transition-opacity duration-300 group-hover:opacity-20 rounded-md"></div>
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
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center mb-1 text-sm group relative"
                                      >
                                        <span className="text-muted-foreground">{output.name}:</span>
                                        <span className="relative">
                                          {output.value}{" "}
                                          {output.unit && (
                                            <span className="text-xs text-muted-foreground">{output.unit}</span>
                                          )}
                                          <div className="absolute inset-0 bg-blue-100 opacity-0 transition-opacity duration-300 group-hover:opacity-20 rounded-md"></div>
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

            <TabsContent value="adjustments" className="mt-4">
              {pausedOnModel && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Output Adjustments</CardTitle>
                      <CardDescription>Modify output values before continuing execution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(pausedModelData || getModelById(pausedOnModel))?.outputs?.map((output, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor={`output-${index}`} className="font-medium">
                                {output.name}
                                {output.unit && <span className="text-muted-foreground ml-1">({output.unit})</span>}
                              </Label>
                              <Badge variant="outline" className="text-xs">
                                Original: {output.value}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                id={`output-${index}`}
                                type="number"
                                defaultValue={output.value}
                                className="flex-1"
                                onChange={(e) => {
                                  // In a real implementation, this would update the output value
                                  // For now, we'll just log it
                                  console.log(`Adjusting ${output.name} to ${e.target.value}`)
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Output adjusted",
                                    description: `${output.name} has been adjusted.`,
                                  })
                                }}
                              >
                                Apply
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {output.description || `Adjust the value of ${output.name} before continuing execution.`}
                            </p>
                          </div>
                        ))}

                        <Separator className="my-4" />

                        <div>
                          <h3 className="text-sm font-medium mb-2">Adjustment Models</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 border rounded-md">
                              <div>
                                <h4 className="font-medium">Variable Adjustment</h4>
                                <p className="text-xs text-muted-foreground">
                                  Apply variable adjustments to model outputs
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Variable Adjustment",
                                    description: "Variable adjustment model would run here.",
                                  })
                                }}
                              >
                                Run Adjustment
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-2 border rounded-md">
                              <div>
                                <h4 className="font-medium">Income Adjustment</h4>
                                <p className="text-xs text-muted-foreground">Apply income-specific adjustments</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Income Adjustment",
                                    description: "Income adjustment model would run here.",
                                  })
                                }}
                              >
                                Run Adjustment
                              </Button>
                            </div>

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                toast({
                                  title: "Add Adjustment Model",
                                  description: "This would open a dialog to add a new adjustment model.",
                                })
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add Adjustment Model
                            </Button>
                          </div>
                        </div>
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
                {getRunId() ? `Run #${getRunId()}` : "New Run"} • {completedModels.length} of {sequence.length} models
                completed
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
                  Optional
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
