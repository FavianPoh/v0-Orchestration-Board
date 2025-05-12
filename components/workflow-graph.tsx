"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Power,
  SkipForward,
  AlertTriangle,
  Snowflake,
  ExternalLink,
  BarChart3,
  FileText,
  Layers,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useModelState } from "@/context/model-state-context"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { DependencyDebug } from "@/components/dependency-debug"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Update the WorkflowGraph component to pass the parallelExecution prop
interface WorkflowGraphProps {
  modelGroups: any[]
  onRunAll?: () => void
  onRunSelected?: (modelId: string) => void
  onToggleBreakpoint?: (modelId: string) => void
  parallelExecution?: boolean // Make sure this prop is defined
}

export function WorkflowGraph({
  modelGroups,
  onRunAll,
  onRunSelected,
  onToggleBreakpoint,
  parallelExecution = false, // Set default to false
}: WorkflowGraphProps) {
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [selectedModuleId, setSelectedModuleId] = useState(null)
  const [moduleData, setModuleData] = useState({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [executionSequence, setExecutionSequence] = useState([])
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [simulationPaused, setSimulationPaused] = useState(false)
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0) // Add a refresh key for forcing re-renders
  const { toast } = useToast()
  const {
    updateModelGroup,
    updateModuleInGroup,
    getModelById,
    getModuleById,
    getExecutionSequence,
    runModel,
    runModule,
    toggleModelEnabled,
    toggleModuleEnabled,
    toggleBreakpoint,
    toggleModuleBreakpoint,
    isSimulationRunning,
    isSimulationPaused,
    pauseExecution,
    resumeExecution,
    continueAfterBreakpoint,
    continueAfterModuleBreakpoint,
    getPausedOnModel,
    getRunId,
    getRunStartTime,
    getRunDuration,
    getRunEndTime,
    getRunMetadata,
    getRunHistory,
    getLastCompletedRunId,
    getIterationCount,
    checkAndRunFinancialModels, // Add this
    toggleModelFrozen,
    isModelFrozen,
    canModelBeFrozen,
    verifyRunCompletionStatus,
    getParallelExecutionGroups,
    isDormant, // Add this
  } = useModelState()
  const containerRef = useRef(null)
  const currentExecutionRef = useRef({ pausedModels: new Set() })
  const router = useRouter()

  // Add automatic refresh every 500ms when any model is running
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

  // Add this useEffect to ensure models are always displayed
  useEffect(() => {
    // Force a refresh when the component mounts to ensure models are displayed
    setRefreshKey((prev) => prev + 1)
  }, [])

  // Get the execution sequence from the context
  useEffect(() => {
    const sequence = parallelExecution ? getParallelExecutionGroups().flat() : getExecutionSequence()
    setExecutionSequence(sequence)
  }, [modelGroups, refreshKey, getExecutionSequence, parallelExecution, getParallelExecutionGroups])

  // Update simulation state from context
  useEffect(() => {
    setSimulationRunning(isSimulationRunning())
    setSimulationPaused(isSimulationPaused())
  }, [isSimulationRunning, isSimulationPaused])

  // Add this useEffect to check for completion
  useEffect(() => {
    const isAnyModelRunning = modelGroups.some((model) => model.status === "running")
    const allModelsCompleted = modelGroups.every(
      (model) =>
        !model.enabled || model.status === "completed" || model.status === "disabled" || isModelFrozen(model.id),
    )

    // If no models are running but simulation is still marked as running, verify completion
    if (!isAnyModelRunning && allModelsCompleted && isSimulationRunning() && !isDormant()) {
      console.log("WorkflowGraph detected all models completed but run still marked as running")
      // Call the verification function
      verifyRunCompletionStatus()
    }
  }, [modelGroups, isSimulationRunning, verifyRunCompletionStatus, isModelFrozen, isDormant])

  // Add extra detection for stuck running state
  useEffect(() => {
    if (simulationRunning && !isDormant()) {
      const interval = setInterval(() => {
        // Get the DOM attribute directly
        const isRunningInDOM = document.documentElement.getAttribute("data-simulation-running") === "true"

        // Count completed models
        const completedCount = modelGroups.filter(
          (model) =>
            model.status === "completed" || !model.enabled || model.status === "disabled" || isModelFrozen(model.id),
        ).length

        // If all models are completed or disabled
        if (completedCount === modelGroups.length && isRunningInDOM) {
          console.log("All models completed but run still shows as running - forcing check")
          verifyRunCompletionStatus()
        }
      }, 2000) // Check every 2 seconds

      return () => clearInterval(interval)
    }
  }, [simulationRunning, modelGroups, verifyRunCompletionStatus, isModelFrozen, isDormant])

  const handleSelectModule = (modelId, moduleId) => {
    setSelectedModelId(modelId)
    setSelectedModuleId(moduleId)

    // Ensure we have module data
    const data = ensureModuleData(modelId, moduleId)
    setModuleData(data)

    setIsDialogOpen(true)
  }

  // Helper function to handle continuing after a breakpoint
  const handleContinueAfterBreakpoint = (modelId, e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    if (typeof continueAfterBreakpoint === "function") {
      console.log(`Calling continueAfterBreakpoint for model ${modelId}`)
      continueAfterBreakpoint(modelId)
      toast({
        title: "Continuing execution",
        description: `Continuing execution after breakpoint on model ${getModelById(modelId)?.name || modelId}.`,
      })

      // Force a refresh to ensure the UI updates
      setTimeout(() => {
        setRefreshKey((prev) => prev + 1)
      }, 200)
    }
  }

  const ensureModuleData = (modelId, moduleId) => {
    const result = getModuleById(moduleId)
    if (!result) return {}

    const { module, modelGroup } = result

    // If the module already has inputs and outputs defined, use those
    if (module.inputs && module.outputs) {
      return {
        inputs: [...module.inputs],
        outputs: [...module.outputs],
        description: module.description || "",
        status: module.status || "idle",
        modelName: modelGroup.name,
        moduleName: module.name,
        optional: module.optional || false,
        enabled: module.enabled !== undefined ? module.enabled : true,
        breakpoint: module.breakpoint || false,
      }
    }

    // Otherwise, generate sample data based on the module type
    return {
      inputs: module.inputs || [],
      outputs: module.outputs || [],
      description: module.description || "",
      status: module.status || "idle",
      modelName: modelGroup.name,
      moduleName: module.name,
      optional: module.optional || false,
      enabled: module.enabled !== undefined ? module.enabled : true,
      breakpoint: module.breakpoint || false,
    }
  }

  const handleInputChange = (index, value) => {
    const updatedData = { ...moduleData }
    updatedData.inputs[index].value = value
    setModuleData(updatedData)
  }

  const handleSaveChanges = () => {
    // In a real app, this would update the module data in the backend
    toast({
      title: "Changes saved",
      description: `Updated inputs for ${moduleData.moduleName}.`,
    })
    setIsDialogOpen(false)
  }

  const handleRunModule = () => {
    if (!selectedModelId || !selectedModuleId) return

    // Run the module using the context function
    runModule(selectedModelId, selectedModuleId)

    // Simulate module execution
    toast({
      title: "Module running",
      description: `Started execution of ${moduleData.moduleName}.`,
    })

    // Refresh module data after a delay
    setTimeout(() => {
      const data = ensureModuleData(selectedModelId, selectedModuleId)
      setModuleData(data)
    }, 2000)
  }

  const handleToggleEnabled = (modelId) => {
    toggleModelEnabled(modelId)
    const model = modelGroups.find((m) => m.id === modelId)

    toast({
      title: `${model.name} ${model.enabled ? "disabled" : "enabled"}`,
      description: `The model has been ${model.enabled ? "removed from" : "added to"} the workflow sequence.`,
    })
  }

  const handleToggleModuleEnabled = (modelId, moduleId) => {
    toggleModuleEnabled(modelId, moduleId)
    const model = modelGroups.find((m) => m.id === modelId)
    const module = model?.modules?.find((m) => m.id === moduleId)

    // If this is the currently selected module, update the module data
    if (selectedModelId === modelId && selectedModuleId === moduleId) {
      setModuleData({
        ...moduleData,
        enabled: !module.enabled,
      })
    }

    toast({
      title: `${module.name} ${module.enabled ? "disabled" : "enabled"}`,
      description: `The module has been ${module.enabled ? "removed from" : "added to"} the execution sequence.`,
    })
  }

  const handleToggleModuleBreakpoint = (modelId, moduleId, e) => {
    e.stopPropagation()
    e.preventDefault() // Prevent any default behavior

    toggleModuleBreakpoint(modelId, moduleId)
    const model = modelGroups.find((m) => m.id === modelId)
    const module = model?.modules?.find((m) => m.id === moduleId)

    // If this is the currently selected module, update the module data
    if (selectedModelId === modelId && selectedModuleId === moduleId) {
      setModuleData({
        ...moduleData,
        breakpoint: !module.breakpoint,
      })
    }

    // Show a minimal toast notification
    toast({
      title: `Breakpoint ${module.breakpoint ? "removed from" : "set on"} ${module.name}`,
      description: `Execution will ${module.breakpoint ? "not pause" : "pause"} after ${module.name} completes.`,
      duration: 2000,
    })

    // Force refresh to update UI immediately
    setRefreshKey((prev) => prev + 1)
  }

  const getStatusBadge = (status, modelId = null) => {
    // Check if this model is paused at a breakpoint
    const isPaused = modelId && getPausedOnModel() === modelId

    // Handle explicit "paused" status or models that are paused at a breakpoint
    if (status === "paused" || isPaused) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Pause className="w-3 h-3 mr-1" /> Paused at Breakpoint
        </Badge>
      )
    }

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
      case "idle":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" /> Idle
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

  const renderInputControl = (input, index) => {
    switch (input.type) {
      case "number":
        if (input.min !== undefined && input.max !== undefined) {
          return (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">
                  {input.value} {input.unit}
                </span>
                <span className="text-xs text-muted-foreground">
                  Range: {input.min} - {input.max} {input.unit}
                </span>
              </div>
              <Slider
                value={[Number.parseFloat(input.value)]}
                min={input.min}
                max={input.max}
                step={input.step || 1}
                onValueChange={(value) => handleInputChange(index, value[0])}
              />
            </div>
          )
        } else {
          return (
            <div className="flex">
              <Input
                type="number"
                value={input.value}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="flex-1"
              />
              {input.unit && <div className="flex items-center px-3 border rounded-r-md bg-muted">{input.unit}</div>}
            </div>
          )
        }
      case "string":
        return <Input type="text" value={input.value} onChange={(e) => handleInputChange(index, e.target.value)} />
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={input.value}
              onChange={(e) => handleInputChange(index, e.target.checked)}
              id={`input-${index}`}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor={`input-${index}`} className="text-sm">
              {input.value ? "Yes" : "No"}
            </label>
          </div>
        )
      case "object":
        return (
          <div className="space-y-2">
            <textarea
              value={typeof input.value === "object" ? JSON.stringify(input.value, null, 2) : input.value}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className="w-full h-20 p-2 text-xs font-mono border rounded-md"
              readOnly
            />
            <div className="text-xs text-muted-foreground">Complex object from {input.source}</div>
          </div>
        )
      default:
        return <Input type="text" value={input.value} onChange={(e) => handleInputChange(index, e.target.value)} />
    }
  }

  // CRITICAL FIX: This is the function that needs to be fixed to prevent the popup
  // and ensure proper toggling of breakpoints
  const handleToggleBreakpoint = (modelId, e) => {
    // Stop event propagation and prevent default behavior
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // Get the current model to check its breakpoint state
    const model = getModelById(modelId)
    const isCurrentlyBreakpointed = model && model.breakpoint

    // Call the context function to toggle the breakpoint
    toggleBreakpoint(modelId)

    // Apply immediate visual feedback by directly updating the DOM
    // Find the card element for this model and add/remove a class
    const modelCard = document.querySelector(`[data-model-id="${modelId}"]`)
    if (modelCard) {
      if (isCurrentlyBreakpointed) {
        modelCard.classList.remove("has-breakpoint")
        modelCard.classList.remove("border-l-4")
        modelCard.classList.remove("border-red-500")
        modelCard.classList.remove("bg-red-50/30")
        modelCard.classList.remove("shadow-[0_0_0_1px_rgba(239,68,68,0.3)]")
      } else {
        modelCard.classList.add("has-breakpoint")
        modelCard.classList.add("border-l-4")
        modelCard.classList.add("border-red-500")
        modelCard.classList.add("bg-red-50/30")
        modelCard.classList.add("shadow-[0_0_0_1px_rgba(239,68,68,0.3)]")
      }
    }

    // Find the breakpoint button and update its appearance
    const breakpointButton = document.querySelector(`[data-model-id="${modelId}"] button[title*="breakpoint"]`)
    if (breakpointButton) {
      if (isCurrentlyBreakpointed) {
        breakpointButton.classList.remove("text-red-500")
        breakpointButton.classList.remove("bg-red-50")
        breakpointButton.classList.remove("border")
        breakpointButton.classList.remove("border-red-200")
      } else {
        breakpointButton.classList.add("text-red-500")
        breakpointButton.classList.add("bg-red-50")
        breakpointButton.classList.add("border")
        breakpointButton.classList.add("border-red-200")
      }
    }

    // Show a toast notification with a resume action button
    toast({
      title: isCurrentlyBreakpointed ? "Breakpoint removed" : "Breakpoint set",
      description: isCurrentlyBreakpointed
        ? "Execution will continue without pausing"
        : "Execution will pause after this model completes",
      // Fix: Don't include action property directly in the toast
      duration: 4000,
    })

    // If not currently breakpointed, show a separate toast with the resume button
    if (!isCurrentlyBreakpointed) {
      // Add a slight delay to ensure the toasts don't overlap
      setTimeout(() => {
        toast({
          title: "Resume option",
          description: "Click the button below to automatically resume when this breakpoint is hit",
          action: (
            <Button
              onClick={() => {
                if (getPausedOnModel() === modelId) {
                  handleContinueAfterBreakpoint(modelId)
                }
              }}
              variant="outline"
              size="sm"
            >
              Resume when hit
            </Button>
          ),
          duration: 5000,
        })
      }, 500)
    }

    // Force refresh to update UI immediately
    setRefreshKey((prev) => prev + 1)

    // If there's a custom handler provided, call it
    if (onToggleBreakpoint) {
      onToggleBreakpoint(modelId)
    }
  }

  // Function to handle running a specific model
  const handleRunModel = (modelId) => {
    const model = modelGroups.find((m) => m.id === modelId)
    if (model) {
      runModel(modelId)
      toast({
        title: "Running model",
        description: `Started execution of ${model.name}.`,
      })
    }
  }

  // Function to handle continuing after a breakpoint
  const handleContinueAfterModuleBreakpoint = (modelId, moduleId) => {
    continueAfterModuleBreakpoint(modelId, moduleId)
    const model = modelGroups.find((m) => m.id === modelId)
    const module = model?.modules?.find((m) => m.id === moduleId)

    toast({
      title: "Continuing execution",
      description: `Continuing execution after breakpoint on module ${module.name}.`,
    })
  }

  useEffect(() => {
    const checkForBlockedModels = () => {
      const blockedModels = modelGroups.filter(
        (model) =>
          model.dependencies &&
          model.dependencies.some((depId) => {
            // Only check direct dependencies
            return getPausedOnModel() === depId
          }),
      )

      if (blockedModels.length > 0 && getPausedOnModel()) {
        const pausedModelId = getPausedOnModel()
        const pausedModel = getModelById(pausedModelId)

        toast({
          title: "Models blocked by paused dependencies",
          description: `${blockedModels.length} models are waiting for ${pausedModel?.name || "a paused model"} to complete.`,
          variant: "warning",
          action: (
            <Button
              onClick={() => {
                if (pausedModelId) {
                  handleContinueAfterBreakpoint(pausedModelId)
                }
              }}
              variant="outline"
              size="sm"
            >
              Resume Execution
            </Button>
          ),
          duration: 8000,
        })
      }
    }

    if (isSimulationRunning() && isSimulationPaused()) {
      checkForBlockedModels()
    }
  }, [modelGroups, isSimulationRunning, isSimulationPaused, getPausedOnModel])

  const handleToggleModelFrozen = (modelId) => {
    if (!canModelBeFrozen(modelId)) {
      toast({
        title: "Cannot freeze model",
        description: "Only completed models can be frozen.",
        variant: "destructive",
      })
      return
    }

    toggleModelFrozen(modelId)
    const model = modelGroups.find((m) => m.id === modelId)
    toast({
      title: isModelFrozen(modelId) ? "Model unfrozen" : "Model frozen",
      description: `${model?.name || modelId} has been ${isModelFrozen(modelId) ? "unfrozen" : "frozen"}.`,
    })
  }

  const getStatusBadgeModel = (status, modelId = null) => {
    // Check if this model is paused at a breakpoint
    const isPaused = modelId && getPausedOnModel() === modelId
    const isInPausedSet = modelId && getPausedOnModel() === modelId

    // Handle explicit "paused" status or models that are paused at a breakpoint
    if (status === "paused" || isPaused || isInPausedSet) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Pause className="w-3 h-3 mr-1" /> Paused at Breakpoint
        </Badge>
      )
    }

    // Check if this model is blocked by a breakpointed dependency
    const model = getModelById(modelId)
    if (model && model.status === "blocked" && model.blockingDependencyId) {
      const blockingModel = getModelById(model.blockingDependencyId)
      if (blockingModel && getPausedOnModel() === blockingModel.id) {
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            <Clock className="w-3 h-3 mr-1" /> Waiting on Breakpoint
          </Badge>
        )
      }
    }

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
      case "idle":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" /> Idle
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

  // Helper function to get key outputs for a model
  const getModelKeyOutputs = (model) => {
    if (!model) return []

    // Get outputs from completed modules
    const outputs = []

    if (model.modules) {
      model.modules.forEach((module) => {
        if (module.status === "completed" && module.outputs) {
          module.outputs.forEach((output) => {
            if (output.key) {
              outputs.push({
                name: output.name,
                value: output.value,
                unit: output.unit,
                moduleId: module.id,
                moduleName: module.name,
              })
            }
          })
        }
      })
    }

    // If no key outputs found, return some sample outputs based on model type
    if (outputs.length === 0) {
      if (model.name.includes("Economic")) {
        return [
          { name: "GDP Growth", value: "2.3", unit: "%", moduleId: "", moduleName: "Economic Forecasting" },
          { name: "Inflation Rate", value: "3.1", unit: "%", moduleId: "", moduleName: "Inflation Analysis" },
        ]
      } else if (model.name.includes("Market")) {
        return [
          { name: "Market Volatility", value: "18.7", unit: "%", moduleId: "", moduleName: "Market Analysis" },
          { name: "Price Elasticity", value: "0.82", unit: "", moduleId: "", moduleName: "Pricing Model" },
        ]
      } else if (model.name.includes("Risk")) {
        return [
          { name: "VaR (95%)", value: "4.2", unit: "M", moduleId: "", moduleName: "Risk Assessment" },
          { name: "Stress Test Impact", value: "-8.3", unit: "%", moduleId: "", moduleName: "Stress Testing" },
        ]
      } else if (model.name.includes("Financial")) {
        return [
          { name: "Interest Rate Forecast", value: "4.5", unit: "%", moduleId: "", moduleName: "Rate Forecasting" },
          { name: "Stock Market Trend", value: "Bullish", unit: "", moduleId: "", moduleName: "Market Trends" },
        ]
      } else if (model.name.includes("Capital")) {
        return [
          { name: "Capital Adequacy Ratio", value: "12.8", unit: "%", moduleId: "", moduleName: "Capital Analysis" },
          { name: "Optimal Allocation", value: "Diversified", unit: "", moduleId: "", moduleName: "Allocation Model" },
        ]
      } else if (model.name.includes("Balance")) {
        return [
          { name: "Asset Growth", value: "5.7", unit: "%", moduleId: "", moduleName: "Asset Projection" },
          { name: "Liability Ratio", value: "0.68", unit: "", moduleId: "", moduleName: "Liability Analysis" },
        ]
      } else {
        return [
          { name: "Key Metric 1", value: "Value 1", unit: "", moduleId: "", moduleName: "Module 1" },
          { name: "Key Metric 2", value: "Value 2", unit: "", moduleId: "", moduleName: "Module 2" },
        ]
      }
    }

    return outputs
  }

  return (
    <div className="space-y-6">
      <DependencyDebug />

      {/* Add a button to manually check and run Financial Models */}
      <div className="mb-4">
        <Button
          onClick={() => {
            const result = checkAndRunFinancialModels()
            toast({
              title: result ? "Financial Models started" : "Financial Models dependencies not met",
              description: result
                ? "Financial Models execution has been initiated."
                : "Not all dependencies are satisfied for Financial Models.",
            })
          }}
          variant="outline"
          className="w-full"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Check & Run Financial Models
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {!simulationRunning ? (
            <Button
              onClick={() => {
                if (typeof onRunAll === "function") onRunAll()
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              Run All
            </Button>
          ) : simulationPaused ? (
            <Button onClick={resumeExecution}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button onClick={pauseExecution}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}

          {simulationPaused && getPausedOnModel() && (
            <Button
              onClick={() => handleContinueAfterBreakpoint(getPausedOnModel())}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Continue Past Breakpoint
            </Button>
          )}
        </div>

        <div className="flex items-center text-sm">
          <Badge variant={simulationPaused ? "outline" : "secondary"} className="mr-2">
            {getRunId()
              ? `Run #${getRunId().substring(getRunId().length - 4)}`
              : getLastCompletedRunId()
                ? `Last: #${getLastCompletedRunId().substring(getLastCompletedRunId().length - 4)}`
                : "New Run"}
          </Badge>
          {getIterationCount() > 0 && (
            <span className="text-xs text-muted-foreground">Iteration {getIterationCount() + 1}</span>
          )}
          {!simulationRunning && getLastCompletedRunId() && (
            <span className="text-xs text-muted-foreground ml-2">
              Last duration:{" "}
              {getRunMetadata(getLastCompletedRunId())?.endTime && getRunMetadata(getLastCompletedRunId())?.startTime
                ? Math.floor(
                    (getRunMetadata(getLastCompletedRunId())?.endTime -
                      getRunMetadata(getLastCompletedRunId())?.startTime) /
                      1000,
                  )
                : 0}
              s
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" ref={containerRef}>
        {executionSequence.map((model, index) => {
          const isPaused = model.status === "paused" || getPausedOnModel() === model.id
          const keyOutputs = getModelKeyOutputs(model)

          return (
            <Card
              key={model.id}
              data-model-id={model.id}
              className={`${model.enabled ? "" : "opacity-60"} 
    ${model.id.startsWith("test-model-") ? "border-blue-300" : ""} 
    ${model.breakpoint ? "has-breakpoint border-l-4 border-red-500 bg-red-50/30" : ""} 
    ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3
                      className={`font-medium flex items-center ${model.id.startsWith("test-model-") ? "text-blue-700" : ""}`}
                    >
                      {model.name}
                      {model.optional && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Optional
                        </Badge>
                      )}
                      {isModelFrozen(model.id) && (
                        <Badge className="bg-blue-100 text-blue-600 flex items-center gap-1">
                          <Snowflake className="h-3 w-3" /> Frozen
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusBadgeModel(model.status, model.id)}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleToggleBreakpoint(model.id, e)}
                            className={`breakpoint-btn ${model.breakpoint ? "active" : ""}`}
                            data-breakpoint-active={model.breakpoint ? "true" : "false"}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRunModel(model.id)
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Run model</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleEnabled(model.id)
                            }}
                            className={model.enabled ? "text-green-500" : "text-gray-500"}
                            title={model.enabled ? "Disable model" : "Enable model"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{model.enabled ? "Disable model" : "Enable model"}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleModelFrozen(model.id)
                            }}
                            className={isModelFrozen(model.id) ? "text-blue-500" : ""}
                            disabled={!canModelBeFrozen(model.id)}
                            title={
                              canModelBeFrozen(model.id)
                                ? isModelFrozen(model.id)
                                  ? "Unfreeze model"
                                  : "Freeze model"
                                : "Model must be completed to freeze"
                            }
                          >
                            <Snowflake className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canModelBeFrozen(model.id)
                            ? isModelFrozen(model.id)
                              ? "Unfreeze model"
                              : "Freeze model"
                            : "Model must be completed to freeze"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/model-groups/${model.id}`)
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View model details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {model.status === "running" && <Progress value={model.progress} className="h-2 mb-2" />}

                {/* Add Resume button for paused models */}
                {isPaused && (
                  <div className="mt-2 mb-3">
                    <Button
                      onClick={(e) => handleContinueAfterBreakpoint(model.id, e)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      size="sm"
                    >
                      <SkipForward className="mr-2 h-4 w-4" />
                      Resume Execution
                    </Button>
                  </div>
                )}

                {/* Display key outputs */}
                {keyOutputs.length > 0 && (
                  <div className="mt-3 border rounded-md p-2 bg-slate-50">
                    <div className="flex items-center mb-1 text-sm font-medium text-slate-700">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Key Outputs
                    </div>
                    <div className="space-y-1">
                      {keyOutputs.map((output, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-slate-600">{output.name}:</span>
                          <span className="font-medium">
                            {output.value} {output.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {model.dependencies &&
                  model.dependencies.some((depId) => {
                    const depModel = getModelById(depId)
                    return depModel && (depModel.status === "paused" || getPausedOnModel() === depId)
                  }) && (
                    <div className="mt-2 bg-yellow-100 text-yellow-800 p-2 rounded-md border border-yellow-300 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <div className="text-sm">
                        <strong>Blocked:</strong> Waiting on paused dependency
                      </div>
                    </div>
                  )}

                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center">
                      <ChevronRight className="h-3 w-3 inline mr-1 text-muted-foreground" />
                      <span>Modules ({model.modules?.filter((m) => m.enabled).length || 0})</span>
                    </summary>
                    <div className="mt-2 space-y-1 pl-4">
                      {model.modules?.map((module) => (
                        <div
                          key={module.id}
                          className={`flex justify-between items-center p-1 hover:bg-muted rounded-md cursor-pointer text-sm ${
                            module.enabled ? "" : "opacity-60"
                          } ${module.breakpoint ? "border-l-2 border-red-400 pl-2 bg-red-50/20" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/module-details/${module.id}`)
                          }}
                        >
                          <span className="flex items-center">
                            {module.name}
                            {module.optional && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Optional
                              </Badge>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            {getStatusBadge(module.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                runModule(model.id, module.id)
                                toast({
                                  title: "Running module",
                                  description: `Started execution of ${module.name}.`,
                                })
                              }}
                              title="Run module"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleToggleModuleBreakpoint(model.id, module.id, e)}
                              className={module.breakpoint ? "text-red-500 bg-red-50/30" : ""}
                              title={module.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                            >
                              <AlertCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleModuleEnabled(model.id, module.id)
                              }}
                              className={module.enabled ? "text-green-500" : "text-gray-500"}
                              title={module.enabled ? "Disable module" : "Enable module"}
                            >
                              <Power className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </CardContent>
              <CardFooter className="p-2 pt-0 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/model-groups/${model.id}`)
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/model-groups/${model.id}/outputs`)
                  }}
                >
                  <Layers className="h-3 w-3 mr-1" />
                  All Outputs
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
