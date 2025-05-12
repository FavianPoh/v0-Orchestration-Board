"use client"

import { useState, useEffect, useRef } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

// Update the component props interface to include parallelExecution
interface EnhancedExecutionSequenceProps {
  modelGroups?: any[]
  onRunModel?: (modelId: string) => void
  onToggleBreakpoint?: (modelId: string) => void
  onContinueAfterBreakpoint?: (modelId: string) => void
  parallelExecution?: boolean
  onToggleParallelExecution?: () => void
}

export function EnhancedExecutionSequence({
  modelGroups,
  onRunModel,
  onToggleBreakpoint,
  onContinueAfterBreakpoint,
  parallelExecution = false,
  onToggleParallelExecution,
}: EnhancedExecutionSequenceProps) {
  const {
    getExecutionSequence,
    getParallelExecutionGroups,
    runModel,
    isModelFrozen,
    isSimulationRunning,
    isSimulationPaused,
    getCurrentRunningModels,
    getPausedOnModel,
    getFailedModel,
    getModelById,
    toggleBreakpoint,
    continueAfterBreakpoint: contextContinueAfterBreakpoint,
    updateModelGroup,
    currentExecutionRef,
  } = useModelState()

  // Initialize all groups as expanded by default
  const [expandedGroups, setExpandedGroups] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [isModelDetailsOpen, setIsModelDetailsOpen] = useState(false)
  // Add a ref to track if the sheet is already opening to prevent multiple opens
  const isOpeningSheet = useRef(false)

  // Add a click throttling mechanism to prevent multiple rapid clicks
  const [lastClickTime, setLastClickTime] = useState(0)
  const CLICK_THROTTLE_MS = 300 // Minimum time between clicks

  // Initialize all groups as expanded by default when component mounts
  useEffect(() => {
    const parallelGroups = getParallelExecutionGroups()
    const initialExpandedState = {}
    parallelGroups.forEach((_, index) => {
      initialExpandedState[index] = true // Set all groups to expanded
    })
    setExpandedGroups(initialExpandedState)
  }, [])

  // Force refresh when parallelExecution changes
  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [parallelExecution])

  // Force refresh every 1 second to ensure UI stays in sync
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Reset the opening flag when the sheet closes
  useEffect(() => {
    if (!isModelDetailsOpen) {
      isOpeningSheet.current = false
    }
  }, [isModelDetailsOpen])

  const sequence = getExecutionSequence()
  const parallelGroups = getParallelExecutionGroups()
  const running = isSimulationRunning()
  const paused = isSimulationPaused()
  const runningModels = getCurrentRunningModels()
  const pausedOnModel = getPausedOnModel()
  const failedModel = getFailedModel()
  const router = useRouter()

  // Toggle expanded state for a group
  const toggleGroupExpanded = (groupIndex) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupIndex]: !prev[groupIndex],
    }))
  }

  // Add this function to show toast notifications with model outputs
  const showModelToast = (model, status) => {
    if (!model) return

    // Get the toast function from context if available
    const toast = window.toast || console.log

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
      outputInfo = model.outputs
        .map((output) => `${output.name}: ${output.value || "—"}${output.unit ? " " + output.unit : ""}`)
        .join(", ")

      if (outputInfo) {
        description += `\nOutputs: ${outputInfo}`
      }
    }

    // Show the toast
    toast({
      title,
      description,
      duration: 5000,
    })
  }

  // Modify the handleRunModelInner function to show a toast when running a model
  const handleRunModelInner = (modelId) => {
    const model = getModelById(modelId)
    if (model) {
      showModelToast(model, "running")
    }

    // Check if this model depends on any model with an active breakpoint - only check direct dependencies
    const dependsOnBreakpointedModel = model.dependencies?.some((depId) =>
      currentExecutionRef.current.pausedModels.has(depId),
    )

    if (dependsOnBreakpointedModel) {
      console.log(`Model ${model.id} depends on a model with an active breakpoint, cannot run yet`)
      // Update model status to show it's blocked by a breakpoint
      updateModelGroup(model.id, {
        status: "blocked",
        blockingDependencyId: Array.from(currentExecutionRef.current.pausedModels).find((id) =>
          model.dependencies.includes(id),
        ),
        blockingDependencyName: "Paused at breakpoint",
      })
    }

    if (onRunModel) {
      onRunModel(modelId)
    } else {
      runModel(modelId)
    }
  }

  // Update the openModelDetails function to use a more robust approach to prevent multiple opens/closes
  // Replace the existing openModelDetails function with this improved version:

  // Open model details sheet with debounce to prevent multiple opens
  const openModelDetails = (model, e) => {
    // If the event exists, stop propagation and prevent default
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // Navigate to the model details page instead of opening a sheet
    router.push(`/model-groups/${model.id}`)
  }

  // Similarly update the openModuleDetails function:

  const openModuleDetails = (model, module, e) => {
    // If the event exists, stop propagation and prevent default
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    // Navigate to the module details page
    router.push(`/module-details/${module.id}`)
  }

  // Handle toggling a breakpoint without opening the details sheet
  const handleToggleBreakpoint = (e, modelId) => {
    e.stopPropagation() // Prevent opening the details sheet

    const model = getModelById(modelId)
    const isSettingBreakpoint = !model?.breakpoint

    toggleBreakpoint(modelId)

    // Show minimal toast notification
    if (window.toast) {
      window.toast({
        title: isSettingBreakpoint ? "Breakpoint set" : "Breakpoint removed",
        duration: 2000,
      })
    }

    // Force refresh to update UI immediately
    setRefreshKey((prev) => prev + 1)
  }

  // Check if a model is paused
  const isModelPaused = (modelId) => {
    return pausedOnModel === modelId
  }

  // Handle continuing after a breakpoint
  const handleContinueAfterBreakpoint = (modelId) => {
    if (onContinueAfterBreakpoint) {
      onContinueAfterBreakpoint(modelId)
    } else {
      // Use the context function directly if no prop is provided
      contextContinueAfterBreakpoint(modelId)
    }
  }

  // Get status badge component
  const getStatusBadge = (status, modelId = null) => {
    // Check if this model is paused at a breakpoint
    const isPaused = modelId && pausedOnModel === modelId
    const isFailed = modelId && failedModel === modelId
    const isRunning = modelId && runningModels.includes(modelId)
    const isFrozen = modelId && isModelFrozen(modelId)

    // Get the actual model to check its real status
    const model = modelId ? getModelById(modelId) : null
    const actualStatus = model ? model.status : status

    if (isPaused) {
      return (
        <Badge className="bg-yellow-100 text-yellow-600">
          <Pause className="w-3 h-3 mr-1" /> Paused
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

    if (isRunning) {
      return (
        <Badge className="bg-blue-100 text-blue-600">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Running
        </Badge>
      )
    }

    if (isFrozen) {
      return (
        <Badge className="bg-indigo-100 text-indigo-600">
          <Settings className="w-3 h-3 mr-1" /> Frozen
        </Badge>
      )
    }

    switch (actualStatus) {
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
            <Clock className="w-3 h-3 mr-1" /> Blocked
          </Badge>
        )
      case "idle":
        return (
          <Badge className="bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{actualStatus || "Unknown"}</Badge>
    }
  }

  // Get and display upstream dependencies for a model
  const getUpstreamDependencies = (modelId) => {
    const model = getModelById(modelId)
    if (!model || !model.dependencies || model.dependencies.length === 0) return null

    return (
      <div className="mt-2 text-xs">
        <div className="text-muted-foreground mb-1">Upstream Dependencies:</div>
        <div className="flex flex-wrap gap-1">
          {model.dependencies.map((depId) => {
            const depModel = getModelById(depId)
            if (!depModel) return null

            // Determine badge color based on dependency status
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
                  router.push(`/model-groups/${depId}`)
                }}
              >
                {depModel.name || depId}
              </Badge>
            )
          })}
        </div>
      </div>
    )
  }

  // Get the actual values from the renderModelOutputs function
  const renderModelOutputs = (model) => {
    // Even if there are no outputs defined, show a placeholder for test models
    if ((!model.outputs || model.outputs.length === 0) && model.id.startsWith("test-model")) {
      return (
        <div className="mt-2 text-sm">
          <div className="font-medium text-gray-700 mb-1">Key Outputs:</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center p-1 rounded relative bg-blue-50 border border-blue-200">
              <span className="font-medium mr-1">Test Output:</span>
              <span className="text-gray-700">42</span>
              <span className="absolute right-1 top-1 text-xs text-blue-500">
                <RefreshCw className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      )
    }

    if (!model.outputs || model.outputs.length === 0) {
      return null
    }

    return (
      <div className="mt-2 text-sm">
        <div className="font-medium text-gray-700 mb-1">Key Outputs:</div>
        <div className="grid grid-cols-2 gap-2">
          {model.outputs.map((output, i) => (
            <div
              key={i}
              className={`flex items-center p-1 rounded relative ${
                output.changed ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
              }`}
            >
              <span className="font-medium mr-1">{output.name}:</span>
              <span className="text-gray-700">
                {output.value !== null && output.value !== undefined
                  ? output.value
                  : model.id.startsWith("test-model")
                    ? "42"
                    : "—"}
              </span>
              {output.unit && <span className="text-xs ml-1 text-gray-500">{output.unit}</span>}
              {(output.changed || model.status === "completed") && (
                <span className="absolute right-1 top-1 text-xs text-blue-500">
                  <RefreshCw className="h-3 w-3" />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render model details sheet
  const renderModelDetailsSheet = () => {
    if (!selectedModel) return null

    return (
      <Sheet open={isModelDetailsOpen} onOpenChange={setIsModelDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] md:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedModel.name}</SheetTitle>
            {selectedModel?.breakpoint && (
              <div className="mt-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">Breakpoint Active</div>
                  <div className="text-sm">Execution will pause after this model completes</div>
                </div>
              </div>
            )}
            <SheetDescription>{selectedModel.description || "Model details and configuration"}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Model Status */}
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              {getStatusBadge(selectedModel.status, selectedModel.id)}
            </div>

            {/* Model Outputs */}
            {selectedModel.outputs && selectedModel.outputs.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Outputs</h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedModel.outputs.map((output, i) => (
                    <div key={i} className="bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{output.name}</span>
                        <span>
                          {output.value || "—"}
                          {output.unit && <span className="text-xs ml-1">{output.unit}</span>}
                        </span>
                      </div>
                      {output.description && <p className="text-sm text-gray-500 mt-1">{output.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Dependencies */}
            {selectedModel.dependencies && selectedModel.dependencies.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Dependencies</h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedModel.dependencies.map((depId, i) => {
                    const depModel = getModelById(depId)
                    return (
                      <div key={i} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                        <span>{depModel ? depModel.name : depId}</span>
                        {depModel && getStatusBadge(depModel.status, depModel.id)}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Modules */}
            {selectedModel.modules && selectedModel.modules.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Modules</h3>
                <Accordion type="multiple" className="w-full">
                  {selectedModel.modules.map((module, i) => (
                    <AccordionItem key={i} value={`module-${i}`}>
                      <AccordionTrigger className="hover:bg-gray-50 px-2 rounded-md">
                        <div className="flex items-center">
                          <span>{module.name}</span>
                          {module.status && (
                            <Badge className="ml-2" variant="outline">
                              {module.status}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2">
                        {module.description && <p className="text-sm text-gray-500 mb-2">{module.description}</p>}

                        {/* Module Inputs */}
                        {module.inputs && module.inputs.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-1">Inputs</h4>
                            <div className="grid grid-cols-1 gap-1">
                              {module.inputs.map((input, j) => (
                                <div key={j} className="text-sm bg-gray-100 p-1 rounded">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{input.name}</span>
                                    <span>
                                      {input.value || "—"}
                                      {input.unit && <span className="text-xs ml-1">{input.unit}</span>}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Module Outputs */}
                        {module.outputs && module.outputs.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Outputs</h4>
                            <div className="grid grid-cols-1 gap-1">
                              {module.outputs.map((output, j) => (
                                <div key={j} className="text-sm bg-gray-100 p-1 rounded">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{output.name}</span>
                                    <span>
                                      {output.value || "—"}
                                      {output.unit && <span className="text-xs ml-1">{output.unit}</span>}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Execution Details */}
            <div>
              <h3 className="font-medium mb-2">Execution Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedModel.startTime && (
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Started:</span>
                    <div>{new Date(selectedModel.startTime).toLocaleTimeString()}</div>
                  </div>
                )}
                {selectedModel.endTime && (
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Completed:</span>
                    <div>{new Date(selectedModel.endTime).toLocaleTimeString()}</div>
                  </div>
                )}
                {selectedModel.executionTime && (
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Duration:</span>
                    <div>{selectedModel.executionTime}s</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Card key={refreshKey}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Model Execution Sequence</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleParallelExecution}
            className={`flex items-center ${parallelExecution ? "bg-blue-50 border-blue-300" : ""}`}
          >
            {parallelExecution ? (
              <>
                <Zap className="mr-1 h-3 w-3 text-blue-600" /> Parallel Mode
                {parallelExecution && <Badge className="ml-1 bg-blue-100 text-blue-600 text-xs">Active</Badge>}
              </>
            ) : (
              "Sequential Mode"
            )}
          </Button>
        </div>
        <CardDescription>
          {parallelExecution
            ? "Models run in parallel groups based on dependencies"
            : "Models run in sequence based on dependencies"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {parallelExecution ? (
          // Parallel Execution View
          <div className="space-y-4">
            {parallelGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border rounded-md overflow-hidden">
                <div
                  className={`flex justify-between items-center p-3 cursor-pointer ${
                    expandedGroups[groupIndex] ? "bg-gray-50" : "bg-white"
                  }`}
                  onClick={() => toggleGroupExpanded(groupIndex)}
                >
                  <div className="flex items-center">
                    {expandedGroups[groupIndex] ? (
                      <ChevronDown className="w-4 h-4 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-medium">Group {groupIndex + 1}</span>
                    <Badge className="ml-2 bg-blue-100 text-blue-600">{group.length} models</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {group.some((model) => runningModels.includes(model.id)) && (
                      <Badge className="bg-blue-100 text-blue-600">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Running
                      </Badge>
                    )}
                    {group.some((model) => model.status === "completed") && (
                      <Badge className="bg-green-100 text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" /> Completed
                      </Badge>
                    )}
                    {group.some((model) => model.status === "idle") && (
                      <Badge className="bg-gray-100 text-gray-600">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
                {expandedGroups[groupIndex] && (
                  <div className="p-3 border-t">
                    <div className="grid grid-cols-1 gap-2">
                      {group.map((model) => {
                        const isPaused = pausedOnModel === model.id
                        return (
                          <div
                            key={model.id}
                            className={`p-3 rounded-md ${
                              isPaused && pausedOnModel === model.id
                                ? "bg-amber-100 border-2 border-amber-500 shadow-md animate-pulse"
                                : runningModels.includes(model.id)
                                  ? "bg-blue-50 border border-blue-200"
                                  : model.status === "completed"
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-gray-50 border border-gray-200"
                            } ${model.breakpoint ? "border-l-4 border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.4)] bg-red-50/30" : ""}`}
                            onClick={(e) => openModelDetails(model, e)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="font-medium">{model.name}</span>
                                {model.breakpoint && <Badge className="ml-2 bg-red-100 text-red-600">Breakpoint</Badge>}
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(model.status, model.id)}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openModelDetails(model, e)
                                        }}
                                      >
                                        <Info className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View model details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Button
                                  size="sm"
                                  variant={model.breakpoint ? "destructive" : "outline"}
                                  className={`h-7 px-2 rounded-md ${
                                    model.breakpoint
                                      ? "bg-red-100 hover:bg-red-200 text-red-600 border-red-300"
                                      : "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200"
                                  }`}
                                  onClick={(e) => handleToggleBreakpoint(e, model.id)}
                                  title={model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </Button>
                                {/* Add the Resume button for paused models */}
                                {isModelPaused(model.id) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleContinueAfterBreakpoint(model.id)
                                          }}
                                        >
                                          <Play className="h-3 w-3 mr-1" /> Resume
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Continue execution after breakpoint</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {model.status !== "completed" && !runningModels.includes(model.id) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRunModelInner(model.id)
                                    }}
                                    disabled={running && !paused}
                                  >
                                    <Play className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Render model outputs */}
                            {renderModelOutputs(model)}

                            {/* Display upstream dependencies */}
                            {getUpstreamDependencies(model.id)}

                            {/* Render modules if available */}
                            {model.modules && model.modules.length > 0 && (
                              <div className="mt-3">
                                <Accordion type="multiple" className="w-full">
                                  <AccordionItem value={`modules-${model.id}`}>
                                    <AccordionTrigger
                                      className="py-1 text-sm"
                                      onClick={(e) => {
                                        // Stop propagation to prevent the model details from opening
                                        e.stopPropagation()
                                      }}
                                    >
                                      <span className="text-gray-700">Modules ({model.modules.length})</span>
                                    </AccordionTrigger>
                                    <AccordionContent onClick={(e) => e.stopPropagation()}>
                                      <div className="grid grid-cols-1 gap-1 mt-1">
                                        {model.modules.map((module, i) => (
                                          <div
                                            key={i}
                                            className="flex justify-between items-center p-2 text-sm bg-white rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openModuleDetails(model, module, e)
                                            }}
                                          >
                                            <span>{module.name}</span>
                                            <Badge
                                              variant="outline"
                                              className={
                                                module.status === "completed"
                                                  ? "bg-green-50 text-green-600"
                                                  : module.status === "running"
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "bg-gray-50 text-gray-600"
                                              }
                                            >
                                              {module.status || "pending"}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Sequential Execution View
          <div className="space-y-2">
            {sequence.map((model, index) => {
              const isPaused = pausedOnModel === model.id
              return (
                <div key={model.id}>
                  <div
                    className={`p-3 rounded-md ${
                      isPaused && pausedOnModel === model.id
                        ? "bg-amber-100 border-2 border-amber-500 shadow-md animate-pulse"
                        : runningModels.includes(model.id)
                          ? "bg-blue-50 border border-blue-200"
                          : model.status === "completed"
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-200"
                    } ${model.breakpoint ? "border-l-4 border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.4)] bg-red-50/30" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium">{model.name}</span>
                        {model.breakpoint && <Badge className="ml-2 bg-red-100 text-red-600">Breakpoint</Badge>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(model.status, model.id)}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openModelDetails(model, e)
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View model details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          size="sm"
                          variant={model.breakpoint ? "destructive" : "outline"}
                          className={`h-7 px-2 rounded-md ${
                            model.breakpoint
                              ? "bg-red-100 hover:bg-red-200 text-red-600 border-red-300"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200"
                          }`}
                          onClick={(e) => handleToggleBreakpoint(e, model.id)}
                          title={model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                        {/* Add the Resume button for paused models */}
                        {isModelPaused(model.id) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleContinueAfterBreakpoint(model.id)
                                  }}
                                >
                                  <Play className="h-3 w-3 mr-1" /> Resume
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Continue execution after breakpoint</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {model.status !== "completed" && !runningModels.includes(model.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRunModelInner(model.id)
                            }}
                            disabled={running && !paused}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Render model outputs */}
                    {renderModelOutputs(model)}

                    {/* Display upstream dependencies */}
                    {getUpstreamDependencies(model.id)}

                    {/* Add a warning for models with breakpoints */}
                    {model.breakpoint && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span>Outputs will not be available to downstream models until breakpoint is cleared</span>
                      </div>
                    )}

                    {/* Render modules if available */}
                    {model.modules && model.modules.length > 0 && (
                      <div className="mt-3">
                        <Accordion type="multiple" className="w-full">
                          <AccordionItem value={`modules-${model.id}`}>
                            <AccordionTrigger
                              className="py-1 text-sm"
                              onClick={(e) => {
                                // Stop propagation to prevent the model details from opening
                                e.stopPropagation()
                              }}
                            >
                              <span className="text-gray-700">Modules ({model.modules.length})</span>
                            </AccordionTrigger>
                            <AccordionContent onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-1 gap-1 mt-1">
                                {model.modules.map((module, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center p-2 text-sm bg-white rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openModuleDetails(model, module, e)
                                    }}
                                  >
                                    <span>{module.name}</span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        module.status === "completed"
                                          ? "bg-green-50 text-green-600"
                                          : module.status === "running"
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-gray-50 text-gray-600"
                                      }
                                    >
                                      {module.status || "pending"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </div>
                  {index < sequence.length - 1 && <Separator className="my-2" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Model Details Sheet */}
        {/* {renderModelDetailsSheet()} */}
      </CardContent>
    </Card>
  )
}
