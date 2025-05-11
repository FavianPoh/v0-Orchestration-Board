"use client"

import { useState, useRef } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Play,
  Pause,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  FileText,
  Code,
  Database,
  Layers,
  Zap,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Props interface to receive parallelExecution from parent
interface EnhancedExecutionSequenceProps {
  parallelExecution: boolean
  onToggleParallelExecution: () => void
}

export function EnhancedExecutionSequence({
  parallelExecution,
  onToggleParallelExecution,
}: EnhancedExecutionSequenceProps) {
  const {
    modelGroups,
    getExecutionSequence,
    getParallelExecutionGroups,
    runModel,
    runModule,
    toggleBreakpoint,
    isSimulationRunning,
    isSimulationPaused,
    getCurrentRunningModels,
    getPausedOnModel,
    getFailedModel,
    getModelById,
    getModelDependencies,
    getModelDependents,
    getModelOutputs,
    getModuleOutputs,
  } = useModelState()

  const { toast } = useToast()
  const [expandedModels, setExpandedModels] = useState({})
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [selectedModuleId, setSelectedModuleId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [drilldownTab, setDrilldownTab] = useState("details")

  const sequenceRef = useRef(null)
  const modelRefs = useRef({})

  const sequence = getExecutionSequence()
  const parallelGroups = getParallelExecutionGroups()
  const running = isSimulationRunning()
  const paused = isSimulationPaused()
  const runningModels = getCurrentRunningModels()
  const pausedOnModel = getPausedOnModel()
  const failedModel = getFailedModel()

  // Toggle expanded state for a model
  const toggleExpanded = (modelId) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }))
  }

  // Handle model selection
  const handleSelectModel = (model) => {
    const latestModel = modelGroups.find((m) => m.id === model.id)
    if (latestModel) {
      setSelectedModelId(latestModel.id)
      setExpandedModels((prev) => ({
        ...prev,
        [latestModel.id]: true,
      }))
    }
  }

  // Handle module selection
  const handleSelectModule = (modelId, moduleId) => {
    setSelectedModelId(modelId)
    setSelectedModuleId(moduleId)
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

  // Get model outputs
  const getOutputs = (modelId) => {
    return getModelOutputs ? getModelOutputs(modelId) : {}
  }

  // Get module outputs
  const getModuleOutput = (modelId, moduleId) => {
    return getModuleOutputs ? getModuleOutputs(modelId, moduleId) : {}
  }

  // Format output value
  const formatOutputValue = (value) => {
    if (value === undefined || value === null) return "—"
    if (typeof value === "object") return JSON.stringify(value, null, 2)
    return value.toString()
  }

  // Get status badge component
  const getStatusBadge = (status, modelId = null) => {
    // Check if this model is paused at a breakpoint
    const isPaused = modelId && pausedOnModel === modelId
    const isFailed = modelId && failedModel === modelId

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
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get status icon
  const getStatusIcon = (status = "idle") => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />
      case "error":
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // Get status badge
  const getStatusBadge2 = (status = "idle") => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-600">Completed</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-600">Running</Badge>
      case "error":
      case "failed":
        return <Badge className="bg-red-100 text-red-600">Error</Badge>
      case "disabled":
        return <Badge variant="outline">Disabled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-600">Pending</Badge>
    }
  }

  // Render model drilldown
  const renderModelDrilldown = () => {
    if (!selectedModelId) return null

    const model = getModelById(selectedModelId)
    if (!model) return null

    const outputs = getOutputs(selectedModelId)
    const { dependencies, dependents } = getDependencyInfo(selectedModelId)

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            <FileText className="h-4 w-4 mr-2" /> View Details
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px] md:w-[600px]">
          <SheetHeader>
            <SheetTitle>Model Details: {model.name}</SheetTitle>
            <SheetDescription>{model.description || "No description available"}</SheetDescription>
          </SheetHeader>

          <Tabs value={drilldownTab} onValueChange={setDrilldownTab} className="mt-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
              <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <div>{getStatusBadge(model.status, model.id)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Execution Time</h4>
                  <div className="text-sm">
                    {model.startTime && model.endTime
                      ? `${((model.endTime - model.startTime) / 1000).toFixed(2)}s`
                      : "Not completed"}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Modules</h4>
                <div className="space-y-2">
                  {model.modules && model.modules.length > 0 ? (
                    model.modules.map((module) => (
                      <div
                        key={module.id}
                        className="p-2 border rounded-md flex justify-between items-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelectModule(model.id, module.id)}
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(module.status)}
                          <span>{module.name}</span>
                        </div>
                        {getStatusBadge2(module.status)}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No modules defined</div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button size="sm" onClick={() => handleRunModel(model.id)}>
                  <Play className="h-4 w-4 mr-2" /> Run Model
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleBreakpoint(model.id)}
                  className={model.breakpoint ? "text-red-500" : ""}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {model.breakpoint ? "Remove Breakpoint" : "Set Breakpoint"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="outputs" className="space-y-4">
              <div className="rounded-md border">
                <div className="bg-muted p-2 flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  <h4 className="text-sm font-medium">Model Outputs</h4>
                </div>
                <div className="p-3">
                  {Object.keys(outputs).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(outputs).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-sm font-medium">{key}</div>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                            {formatOutputValue(value)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No outputs available</div>
                  )}
                </div>
              </div>

              {selectedModuleId && (
                <div className="rounded-md border mt-4">
                  <div className="bg-muted p-2 flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    <h4 className="text-sm font-medium">Module Outputs</h4>
                  </div>
                  <div className="p-3">
                    {Object.keys(getModuleOutput(selectedModelId, selectedModuleId)).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(getModuleOutput(selectedModelId, selectedModuleId)).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-sm font-medium">{key}</div>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                              {formatOutputValue(value)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No module outputs available</div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dependencies" className="space-y-4">
              <div className="rounded-md border">
                <div className="bg-muted p-2 flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  <h4 className="text-sm font-medium">Dependencies</h4>
                </div>
                <div className="p-3">
                  {dependencies.length > 0 ? (
                    <div className="space-y-2">
                      {dependencies.map((depId) => {
                        const depModel = getModelById(depId)
                        return (
                          <div
                            key={depId}
                            className="p-2 border rounded-md flex justify-between items-center cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSelectModel(depModel)}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(depModel?.status)}
                              <span>{depModel?.name || depId}</span>
                            </div>
                            {depModel && getStatusBadge2(depModel.status)}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No dependencies</div>
                  )}
                </div>
              </div>

              <div className="rounded-md border mt-4">
                <div className="bg-muted p-2 flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  <h4 className="text-sm font-medium">Dependents</h4>
                </div>
                <div className="p-3">
                  {dependents.length > 0 ? (
                    <div className="space-y-2">
                      {dependents.map((depId) => {
                        const depModel = getModelById(depId)
                        return (
                          <div
                            key={depId}
                            className="p-2 border rounded-md flex justify-between items-center cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSelectModel(depModel)}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(depModel?.status)}
                              <span>{depModel?.name || depId}</span>
                            </div>
                            {depModel && getStatusBadge2(depModel.status)}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No dependents</div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    )
  }

  // Render a model card for the sequential view
  const renderModelCard = (model, index) => {
    // Make sure model is defined before accessing its properties
    if (!model || !model.id) {
      return null // Skip this item if model is undefined
    }

    const isRunning = isModelRunning(model.id)
    const isPaused = isModelPaused(model.id)
    const isFailed = isModelFailed(model.id)
    const outputs = getOutputs(model.id)
    const hasOutputs = Object.keys(outputs).length > 0

    return (
      <Collapsible
        key={model.id}
        open={expandedModels[model.id] || selectedModelId === model.id}
        onOpenChange={() => toggleExpanded(model.id)}
      >
        <div
          className={`relative p-4 rounded-md border cursor-pointer
            ${selectedModelId === model.id ? "border-blue-400 bg-blue-50" : "border-gray-200"}
            ${model.id.startsWith("test-model-") ? "border-blue-300 bg-blue-50" : ""}
            ${isRunning ? "border-2 border-blue-500 bg-blue-50" : ""}
            ${isPaused ? "border-2 border-yellow-500 bg-yellow-50" : ""}
            ${isFailed ? "border-2 border-red-500 bg-red-50" : ""}
            ${model.breakpoint ? "border-l-4 border-red-400" : ""}`}
          onClick={() => handleSelectModel(model)}
          ref={(el) => (modelRefs.current[model.id] = el)}
        >
          <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center">
                <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">
                  {index + 1}
                </span>
                <div>
                  <span className={`font-medium ${model.id.startsWith("test-model-") ? "text-blue-700" : ""}`}>
                    {model.name || `Model ${index + 1}`}
                    {model.breakpoint && (
                      <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Breakpoint
                      </Badge>
                    )}
                  </span>

                  {/* Add headline figures here */}
                  {model.outputs && model.outputs.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {model.outputs.slice(0, 2).map((output, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono">
                          {output.name}: {output.value}
                          {output.unit && <span className="ml-1 opacity-70">{output.unit}</span>}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {model.status === "running" && <Progress value={model.progress || 0} className="h-1 mt-2 w-40" />}
                </div>
              </div>
              <div className="flex items-center">
                {getStatusBadge(model.status, model.id)}
                <Button variant="ghost" size="sm" className="ml-2">
                  {expandedModels[model.id] || selectedModelId === model.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 pt-4 border-t">
            {/* Model Details */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  {isPaused && " (Paused)"}
                  {isFailed && " (Failed)"}
                </div>
                {model.description && (
                  <div className="text-sm col-span-2">
                    <span className="text-muted-foreground">Description:</span> {model.description}
                  </div>
                )}
              </div>

              {/* Key Outputs */}
              {hasOutputs && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Key Outputs</h4>
                  <div className="bg-muted/50 p-3 rounded-md space-y-2">
                    {Object.entries(outputs)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {formatOutputValue(value)}
                          </span>
                        </div>
                      ))}
                    {Object.keys(outputs).length > 3 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => setDrilldownTab("outputs")}
                      >
                        View all outputs...
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex space-x-2 mb-4">
                <Button size="sm" onClick={() => handleRunModel(model.id)}>
                  <Play className="mr-1 h-3 w-3" />
                  Run Model
                </Button>
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
                  onClick={() => {
                    setSelectedModelId(model.id)
                    setDrilldownTab("details")
                  }}
                >
                  <FileText className="mr-1 h-3 w-3" />
                  View Details
                </Button>
              </div>
            </div>

            {/* Modules */}
            {model.modules && model.modules.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-3">Modules ({model.modules.length})</h4>
                <div className="space-y-3">
                  {model.modules.map((module) => {
                    const moduleOutputs = getModuleOutput(model.id, module.id)
                    const hasModuleOutputs = Object.keys(moduleOutputs).length > 0

                    return (
                      <div
                        key={module.id}
                        className={`border rounded-md p-3 hover:bg-gray-50 cursor-pointer ${
                          !module.enabled ? "opacity-60" : ""
                        } ${module.breakpoint ? "border-l-4 border-red-400" : ""}`}
                        onClick={() => handleSelectModule(model.id, module.id)}
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
                                <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> Breakpoint
                                </Badge>
                              )}
                            </div>
                            {module.description && (
                              <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                            )}

                            {/* Module Outputs */}
                            {hasModuleOutputs && (
                              <div className="mt-2 pt-2 border-t">
                                <h5 className="text-xs font-medium mb-1">Key Outputs</h5>
                                <div className="space-y-1">
                                  {Object.entries(moduleOutputs)
                                    .slice(0, 2)
                                    .map(([key, value]) => (
                                      <div key={key} className="flex justify-between items-center text-xs">
                                        <span className="font-medium">{key}:</span>
                                        <span className="text-muted-foreground truncate max-w-[150px]">
                                          {formatOutputValue(value)}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center">
                            {getStatusBadge(module.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRunModule(model.id, module.id)
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No modules defined for this model</div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    )
  }

  // Render a parallel group
  const renderParallelGroup = (group, groupIndex) => {
    return (
      <div key={`group-${groupIndex}`} className="mb-6">
        <div className="flex items-center mb-2">
          <Badge variant="outline" className="mr-2">
            Group {groupIndex + 1}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {group.length} model{group.length !== 1 ? "s" : ""} in parallel
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {group.map((model, modelIndex) => renderModelCard(model, modelIndex))}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">Model Execution Sequence</CardTitle>
          <div className="flex items-center gap-2">
            {selectedModelId && renderModelDrilldown()}

            {/* Add parallel/sequential toggle button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleParallelExecution}
              className={`flex items-center ${parallelExecution ? "bg-blue-50 border-blue-300" : ""}`}
            >
              <Layers className="mr-1 h-4 w-4" />
              {parallelExecution ? (
                <>
                  <Zap className="mr-1 h-3 w-3 text-blue-600" /> Parallel Mode
                </>
              ) : (
                "Sequential Mode"
              )}
              {parallelExecution && <Badge className="ml-1 bg-blue-100 text-blue-600 text-xs">Active</Badge>}
            </Button>
          </div>
        </div>
        <CardDescription>
          {parallelExecution
            ? "Models are grouped by dependency level and can run in parallel"
            : "Models run in sequence based on dependencies"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]" ref={sequenceRef}>
          <div className="p-6">
            {parallelExecution ? (
              // Parallel execution view
              <div className="space-y-4">
                {parallelGroups.map((group, groupIndex) => renderParallelGroup(group, groupIndex))}
              </div>
            ) : (
              // Sequential execution view
              <div className="space-y-3">{sequence.map((model, index) => renderModelCard(model, index))}</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
