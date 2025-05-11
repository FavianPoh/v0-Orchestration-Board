"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
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
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useModelState } from "@/context/model-state-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DependencyDebug } from "@/components/dependency-debug"

export function WorkflowGraph({ modelGroups, onRunAll, onRunSelected, onToggleBreakpoint, parallelExecution }) {
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
  } = useModelState()
  const containerRef = useRef(null)
  const currentExecutionRef = useRef({ pausedModels: new Set() })

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
    if (!isAnyModelRunning && allModelsCompleted && isSimulationRunning()) {
      console.log("WorkflowGraph detected all models completed but run still marked as running")
      // Call the verification function
      const result = verifyRunCompletionStatus()
      if (result) {
        console.log("Run completion verified and state updated")
      }
    }
  }, [modelGroups, isSimulationRunning, verifyRunCompletionStatus, isModelFrozen])

  const handleSelectModule = (modelId, moduleId) => {
    setSelectedModelId(modelId)
    setSelectedModuleId(moduleId)

    // Ensure we have module data
    const data = ensureModuleData(modelId, moduleId)
    setModuleData(data)

    setIsDialogOpen(true)
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

    toast({
      title: `Breakpoint ${module.breakpoint ? "removed from" : "set on"} ${module.name}`,
      description: `Execution will ${module.breakpoint ? "not pause" : "pause"} after ${module.name} completes.`,
    })
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

  // Function to handle continuing after a breakpoint
  const handleContinueAfterBreakpoint = (modelId) => {
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

  // Function to handle toggling a breakpoint
  const handleToggleBreakpoint = (modelId) => {
    toggleBreakpoint(modelId)
    const model = modelGroups.find((m) => m.id === modelId)

    // Force a refresh to ensure the UI updates
    setRefreshKey((prev) => prev + 1)

    toast({
      title: model?.breakpoint ? "Breakpoint removed" : "Breakpoint set",
      description: `Execution will ${model?.breakpoint ? "not pause" : "pause"} after this model`,
    })
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
            const depModel = getModelById(depId)
            return depModel && (depModel.status === "paused" || currentExecutionRef.current.pausedModels.has(depId))
          }),
      )

      if (blockedModels.length > 0 && getPausedOnModel()) {
        toast({
          title: "Models blocked by paused dependencies",
          description: `${blockedModels.length} models are waiting for paused dependencies to complete.`,
          variant: "warning",
          duration: 5000,
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
        {executionSequence.map((model, index) => (
          <Card
            key={model.id}
            className={`${model.enabled ? "" : "opacity-60"} 
    ${model.id.startsWith("test-model-") ? "border-blue-300" : ""} 
    ${model.breakpoint ? "border-red-300" : ""} 
    ${model.status === "paused" || getPausedOnModel() === model.id ? "border-2 border-yellow-500 bg-yellow-50" : ""}`}
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
                  {getStatusBadge(model.status, model.id)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleBreakpoint(model.id)}
                    className={model.breakpoint ? "text-red-500" : ""}
                    title={model.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRunModel(model.id)} title="Run model">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleEnabled(model.id)}
                    className={model.enabled ? "text-green-500" : "text-gray-500"}
                    title={model.enabled ? "Disable model" : "Enable model"}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleModelFrozen(model.id)}
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
                </div>
              </div>

              {model.status === "running" && <Progress value={model.progress} className="h-2 mb-2" />}

              {model.dependencies &&
                model.dependencies.some((depId) => {
                  const depModel = getModelById(depId)
                  return (
                    depModel && (depModel.status === "paused" || currentExecutionRef.current.pausedModels.has(depId))
                  )
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
                        } ${module.breakpoint ? "border-l-2 border-red-400 pl-2" : ""}`}
                        onClick={() => handleSelectModule(model.id, module.id)}
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
                            className={module.breakpoint ? "text-red-500" : ""}
                            title={module.breakpoint ? "Remove breakpoint" : "Set breakpoint"}
                          >
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                          <Switch
                            checked={module.enabled}
                            onCheckedChange={(e) => {
                              e.stopPropagation()
                              handleToggleModuleEnabled(model.id, module.id)
                            }}
                            aria-label={`${module.enabled ? "Disable" : "Enable"} ${module.name}`}
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {model.outputs?.slice(0, 2).map((output, i) => (
                  <div key={i} className="text-center p-2 bg-muted rounded-md">
                    <div className="text-lg font-bold">{output.value}</div>
                    <div className="text-xs text-muted-foreground">
                      {output.name} {output.unit}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {moduleData.moduleName}
              {moduleData.status && getStatusBadge(moduleData.status)}
              {moduleData.optional && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Optional
                </Badge>
              )}
              {moduleData.breakpoint && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Breakpoint
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {moduleData.modelName} &gt; {moduleData.moduleName}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm text-muted-foreground">{moduleData.description}</p>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Status</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(moduleData.status)}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="module-enabled" className="text-sm">
                      Enabled
                    </Label>
                    <Switch
                      id="module-enabled"
                      checked={moduleData.enabled}
                      onCheckedChange={() => {
                        if (selectedModelId && selectedModuleId) {
                          handleToggleModuleEnabled(selectedModelId, selectedModuleId)
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="module-breakpoint" className="text-sm">
                      Breakpoint
                    </Label>
                    <Switch
                      id="module-breakpoint"
                      checked={moduleData.breakpoint}
                      onCheckedChange={() => {
                        if (selectedModelId && selectedModuleId) {
                          toggleModuleBreakpoint(selectedModelId, selectedModuleId)
                          setModuleData({
                            ...moduleData,
                            breakpoint: !moduleData.breakpoint,
                          })
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Input Count</h3>
                  <p className="text-sm">{moduleData.inputs?.length || 0} inputs</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Output Count</h3>
                  <p className="text-sm">{moduleData.outputs?.length || 0} outputs</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Input/Output Relationships</h3>
                <div className="border rounded-md p-3 space-y-2">
                  {moduleData.inputs?.map((input, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{input.name}</span>
                      {input.source && <span className="text-muted-foreground"> ← from {input.source}</span>}
                    </div>
                  ))}
                  <div className="border-t my-2"></div>
                  {moduleData.outputs?.map((output, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{output.name}</span>
                      {output.consumers && output.consumers.length > 0 && (
                        <span className="text-muted-foreground"> → to {output.consumers.join(", ")}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4">
              {moduleData.inputs?.length > 0 ? (
                moduleData.inputs.map((input, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Label htmlFor={`input-${index}`} className="text-sm font-medium">
                        {input.name}
                        {input.unit && <span className="text-muted-foreground ml-1">({input.unit})</span>}
                      </Label>
                      {input.source && (
                        <Badge variant="outline" className="text-xs">
                          From: {input.source}
                        </Badge>
                      )}
                    </div>
                    {input.description && <p className="text-xs text-muted-foreground">{input.description}</p>}
                    {renderInputControl(input, index)}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No inputs defined for this module.</div>
              )}
            </TabsContent>

            <TabsContent value="outputs" className="space-y-4">
              {moduleData.outputs?.length > 0 ? (
                moduleData.outputs.map((output, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{output.name}</h4>
                        {output.description && <p className="text-xs text-muted-foreground">{output.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold">
                          {output.value} <span className="text-muted-foreground">{output.unit}</span>
                        </div>
                      </div>
                    </div>
                    {output.consumers && output.consumers.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Consumed By:</h5>
                        <div className="flex flex-wrap gap-1">
                          {output.consumers.map((consumer, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {consumer}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No outputs defined for this module.</div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRunModule}>
                Run Module
              </Button>
              <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
