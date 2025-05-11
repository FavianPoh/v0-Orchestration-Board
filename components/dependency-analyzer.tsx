"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronRight, GripVertical, MoveDown, MoveUp, Power } from "lucide-react"
import { useModelState } from "@/context/model-state-context"
import { ModuleRunSequence } from "@/components/module-run-sequence"
import { useToast } from "@/components/ui/use-toast"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

// Sortable item component for models
const SortableModelItem = ({
  model,
  index,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  onToggleExpanded,
  isExpanded,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: model.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div
        className={`p-3 rounded-md cursor-pointer ${
          model.optional ? "bg-gray-50" : "bg-gray-100"
        } ${!model.enabled ? "opacity-60" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
              {index + 1}
            </span>
            <div {...attributes} {...listeners} className="cursor-grab p-1">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <span className="font-medium flex items-center">
              {model.name}
              {model.optional && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Optional
                </Badge>
              )}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onToggleEnabled(model.id)
              }}
            >
              <Power className={`h-4 w-4 ${model.enabled ? "text-green-500" : "text-gray-400"}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp(model.id)
              }}
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown(model.id)
              }}
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpanded(model.id)
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      {isExpanded && children}
    </div>
  )
}

// Sortable item component for modules
const SortableModuleItem = ({ module, modelId, index, onToggleEnabled, onMoveUp, onMoveDown }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-1">
      <div
        className={`p-2 rounded-md ${
          module.optional ? "bg-gray-50" : "bg-gray-100"
        } ${!module.enabled ? "opacity-60" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs">
              {index + 1}
            </span>
            <div {...attributes} {...listeners} className="cursor-grab p-1">
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
            <span className="text-sm">
              {module.name}
              {module.optional && (
                <Badge variant="outline" className="ml-1 text-xs">
                  Optional
                </Badge>
              )}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onToggleEnabled(modelId, module.id)
              }}
            >
              <Power className={`h-3 w-3 ${module.enabled ? "text-green-500" : "text-gray-400"}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp(modelId, module.id)
              }}
            >
              <MoveUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown(modelId, module.id)
              }}
            >
              <MoveDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DependencyAnalyzer() {
  const {
    modelGroups,
    updateModelGroup,
    updateModuleInGroup,
    getExecutionSequence,
    getParallelExecutionGroups,
    getExecutionOrder,
    updateExecutionOrder,
    updateModuleExecutionOrder,
  } = useModelState()

  const { toast } = useToast()
  const [executionLevels, setExecutionLevels] = useState([])
  const [executionSequence, setExecutionSequence] = useState([])
  const [parallelExecutionGroups, setParallelExecutionGroups] = useState([])
  const [dependencyMap, setDependencyMap] = useState({})
  const [expandedModels, setExpandedModels] = useState({})
  const [executionOrder, setExecutionOrder] = useState([])
  const [moduleExecutionOrders, setModuleExecutionOrders] = useState({})

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    // Get the execution sequence from the context
    const sequence = getExecutionSequence()
    setExecutionSequence(sequence)

    // Get parallel execution groups
    const parallelGroups = getParallelExecutionGroups()
    setParallelExecutionGroups(parallelGroups)

    // Get the execution order
    const order = getExecutionOrder()
    setExecutionOrder(order)

    // Get module execution orders
    const moduleOrders = {}
    modelGroups.forEach((model) => {
      if (model.modules && model.modules.length > 0) {
        moduleOrders[model.id] = model.moduleExecutionOrder || model.modules.map((m) => m.id)
      }
    })
    setModuleExecutionOrders(moduleOrders)

    // Create dependency map
    const depMap = {}
    modelGroups.forEach((model) => {
      depMap[model.id] = {
        dependencies: model.dependencies || [],
        dependents: [],
        name: model.name,
        enabled: model.enabled,
        optional: model.optional,
      }
    })

    // Populate dependents
    modelGroups.forEach((model) => {
      if (model.dependencies) {
        model.dependencies.forEach((depId) => {
          if (depMap[depId]) {
            depMap[depId].dependents = depMap[depId].dependents || []
            if (!depMap[depId].dependents.includes(model.id)) {
              depMap[depId].dependents.push(model.id)
            }
          }
        })
      }
    })

    setDependencyMap(depMap)

    // Convert parallel groups to the format expected by this component
    const sortedLevels = parallelGroups.map((group, index) => ({
      level: index,
      models: group.map((model) => ({
        id: model.id,
        name: model.name,
        enabled: model.enabled,
        optional: model.optional,
      })),
    }))

    setExecutionLevels(sortedLevels)
  }, [modelGroups, getExecutionSequence, getParallelExecutionGroups, getExecutionOrder])

  const toggleModelExpansion = (modelId) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }))
  }

  const handleToggleEnabled = (modelId) => {
    const model = modelGroups.find((m) => m.id === modelId)
    if (model) {
      const newEnabled = !model.enabled

      updateModelGroup(modelId, {
        enabled: newEnabled,
        status: newEnabled ? "idle" : "disabled",
      })

      toast({
        title: `${model.name} ${newEnabled ? "enabled" : "disabled"}`,
        description: `The model has been ${newEnabled ? "added to" : "removed from"} the workflow sequence.`,
      })
    }
  }

  const handleToggleModuleEnabled = (modelId, moduleId) => {
    const model = modelGroups.find((m) => m.id === modelId)
    if (model && model.modules) {
      const module = model.modules.find((m) => m.id === moduleId)
      if (module) {
        const newEnabled = !module.enabled

        updateModuleInGroup(modelId, moduleId, {
          enabled: newEnabled,
          status: newEnabled ? "idle" : "disabled",
        })

        toast({
          title: `${module.name} ${newEnabled ? "enabled" : "disabled"}`,
          description: `The module has been ${newEnabled ? "added to" : "removed from"} the execution sequence.`,
        })
      }
    }
  }

  const handleMoveModelUp = (modelId) => {
    const currentIndex = executionOrder.indexOf(modelId)
    if (currentIndex > 0) {
      const newOrder = [...executionOrder]
      const temp = newOrder[currentIndex]
      newOrder[currentIndex] = newOrder[currentIndex - 1]
      newOrder[currentIndex - 1] = temp

      updateExecutionOrder(newOrder)
      setExecutionOrder(newOrder)

      toast({
        title: "Execution Order Updated",
        description: `Model moved up in the execution sequence.`,
      })
    }
  }

  const handleMoveModelDown = (modelId) => {
    const currentIndex = executionOrder.indexOf(modelId)
    if (currentIndex < executionOrder.length - 1) {
      const newOrder = [...executionOrder]
      const temp = newOrder[currentIndex]
      newOrder[currentIndex] = newOrder[currentIndex + 1]
      newOrder[currentIndex + 1] = temp

      updateExecutionOrder(newOrder)
      setExecutionOrder(newOrder)

      toast({
        title: "Execution Order Updated",
        description: `Model moved down in the execution sequence.`,
      })
    }
  }

  const handleMoveModuleUp = (modelId, moduleId) => {
    const moduleOrder = moduleExecutionOrders[modelId] || []
    const currentIndex = moduleOrder.indexOf(moduleId)

    if (currentIndex > 0) {
      const newOrder = [...moduleOrder]
      const temp = newOrder[currentIndex]
      newOrder[currentIndex] = newOrder[currentIndex - 1]
      newOrder[currentIndex - 1] = temp

      updateModuleExecutionOrder(modelId, newOrder)
      setModuleExecutionOrders((prev) => ({
        ...prev,
        [modelId]: newOrder,
      }))

      toast({
        title: "Module Order Updated",
        description: `Module moved up in the execution sequence.`,
      })
    }
  }

  const handleMoveModuleDown = (modelId, moduleId) => {
    const moduleOrder = moduleExecutionOrders[modelId] || []
    const currentIndex = moduleOrder.indexOf(moduleId)

    if (currentIndex < moduleOrder.length - 1) {
      const newOrder = [...moduleOrder]
      const temp = newOrder[currentIndex]
      newOrder[currentIndex] = newOrder[currentIndex + 1]
      newOrder[currentIndex + 1] = temp

      updateModuleExecutionOrder(modelId, newOrder)
      setModuleExecutionOrders((prev) => ({
        ...prev,
        [modelId]: newOrder,
      }))

      toast({
        title: "Module Order Updated",
        description: `Module moved down in the execution sequence.`,
      })
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = executionOrder.indexOf(active.id)
      const newIndex = executionOrder.indexOf(over.id)

      const newOrder = [...executionOrder]
      const [removed] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, removed)

      updateExecutionOrder(newOrder)
      setExecutionOrder(newOrder)

      toast({
        title: "Execution Order Updated",
        description: `Model order has been updated.`,
      })
    }
  }

  const handleModuleDragEnd = (modelId) => (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const moduleOrder = moduleExecutionOrders[modelId] || []
      const oldIndex = moduleOrder.indexOf(active.id)
      const newIndex = moduleOrder.indexOf(over.id)

      const newOrder = [...moduleOrder]
      const [removed] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, removed)

      updateModuleExecutionOrder(modelId, newOrder)
      setModuleExecutionOrders((prev) => ({
        ...prev,
        [modelId]: newOrder,
      }))

      toast({
        title: "Module Order Updated",
        description: `Module order has been updated.`,
      })
    }
  }

  return (
    <Tabs defaultValue="sequence" className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="sequence">Execution Sequence</TabsTrigger>
        <TabsTrigger value="levels">Execution Levels</TabsTrigger>
        <TabsTrigger value="relationships">Input/Output Relationships</TabsTrigger>
        <TabsTrigger value="optional">Optional Components</TabsTrigger>
        <TabsTrigger value="order">Sequential Execution Order</TabsTrigger>
      </TabsList>

      <TabsContent value="sequence">
        <Card>
          <CardHeader>
            <CardTitle>Execution Sequence</CardTitle>
            <CardDescription>
              Models are listed in their optimal execution order, taking into account dependencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Sequential Execution</h3>
                <div className="space-y-2">
                  {executionSequence.map((model, index) => (
                    <div key={model.id}>
                      <div
                        className={`p-3 rounded-md cursor-pointer ${
                          model.optional ? "bg-gray-50" : "bg-gray-100"
                        } ${!model.enabled ? "opacity-60" : ""}`}
                        onClick={() => toggleModelExpansion(model.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                              {index + 1}
                            </span>
                            <span className="font-medium flex items-center">
                              {model.name}
                              {model.optional && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Optional
                                </Badge>
                              )}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleEnabled(model.id)
                              }}
                            >
                              <Power className={`h-4 w-4 ${model.enabled ? "text-green-500" : "text-gray-400"}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleModelExpansion(model.id)
                              }}
                            >
                              {expandedModels[model.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {expandedModels[model.id] && (
                        <div className="mt-2 ml-8 mb-4">
                          <ModuleRunSequence
                            modelGroups={modelGroups}
                            modelId={model.id}
                            onToggleModuleEnabled={handleToggleModuleEnabled}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Parallel Execution Groups</h3>
                <div className="space-y-6">
                  {parallelExecutionGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="text-md font-medium mb-2">Group {groupIndex + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.map((model) => (
                          <div
                            key={model.id}
                            className={`p-3 rounded-md cursor-pointer ${
                              model.optional ? "bg-gray-50" : "bg-gray-100"
                            } ${!model.enabled ? "opacity-60" : ""}`}
                            onClick={() => toggleModelExpansion(`parallel-${model.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium flex items-center">
                                {model.name}
                                {model.optional && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Optional
                                  </Badge>
                                )}
                              </span>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleEnabled(model.id)
                                  }}
                                >
                                  <Power className={`h-4 w-4 ${model.enabled ? "text-green-500" : "text-gray-400"}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleModelExpansion(`parallel-${model.id}`)
                                  }}
                                >
                                  {expandedModels[`parallel-${model.id}`] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {group.map(
                        (model) =>
                          expandedModels[`parallel-${model.id}`] && (
                            <div key={`expanded-${model.id}`} className="mt-2 mb-4">
                              <ModuleRunSequence
                                modelGroups={modelGroups}
                                modelId={model.id}
                                onToggleModuleEnabled={handleToggleModuleEnabled}
                              />
                            </div>
                          ),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="levels">
        <Card>
          <CardHeader>
            <CardTitle>Execution Levels</CardTitle>
            <CardDescription>
              Models are grouped by their execution level, with level 0 being the first to execute. Models within the
              same level can be executed in parallel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {executionLevels.map((level) => (
                <div key={level.level} className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Level {level.level}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {level.models.map((model) => (
                      <div
                        key={model.id}
                        className={`p-3 rounded-md cursor-pointer ${
                          model.enabled ? "bg-gray-100" : "bg-gray-50 opacity-60"
                        }`}
                        onClick={() => toggleModelExpansion(`level-${model.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            {model.name}
                            {model.optional && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Optional
                              </Badge>
                            )}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleEnabled(model.id)
                              }}
                            >
                              <Power className={`h-4 w-4 ${model.enabled ? "text-green-500" : "text-gray-400"}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleModelExpansion(`level-${model.id}`)
                              }}
                            >
                              {expandedModels[`level-${model.id}`] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {level.models.map(
                    (model) =>
                      expandedModels[`level-${model.id}`] && (
                        <div key={`expanded-level-${model.id}`} className="mt-2 mb-4 ml-4">
                          <ModuleRunSequence
                            modelGroups={modelGroups}
                            modelId={model.id}
                            onToggleModuleEnabled={handleToggleModuleEnabled}
                          />
                        </div>
                      ),
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="relationships">
        <Card>
          <CardHeader>
            <CardTitle>Input/Output Relationships</CardTitle>
            <CardDescription>
              This view shows how data flows between models through their inputs and outputs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {modelGroups.map((model) => (
                <div key={model.id} className={`border rounded-lg p-4 ${!model.enabled ? "opacity-60" : ""}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium flex items-center">
                      {model.name}
                      {model.optional && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Optional
                        </Badge>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={model.enabled ? "default" : "outline"} className="text-xs">
                        {model.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Switch
                        checked={model.enabled}
                        onCheckedChange={() => handleToggleEnabled(model.id)}
                        aria-label={`${model.enabled ? "Disable" : "Enable"} ${model.name}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Inputs From:</h4>
                      {model.dependencies && model.dependencies.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {model.dependencies.map((depId) => {
                            const depModel = modelGroups.find((m) => m.id === depId)
                            return (
                              <li key={depId} className="text-sm">
                                {depModel ? depModel.name : depId}
                                {depModel && depModel.outputs && (
                                  <ul className="list-circle pl-5 text-xs text-gray-500 mt-1">
                                    {depModel.outputs.map((output, i) => (
                                      <li key={i}>{output.name}</li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No inputs from other models</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Outputs To:</h4>
                      {dependencyMap[model.id]?.dependents && dependencyMap[model.id]?.dependents.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {dependencyMap[model.id].dependents.map((depId) => {
                            const depModel = modelGroups.find((m) => m.id === depId)
                            return (
                              <li key={depId} className="text-sm">
                                {depModel ? depModel.name : depId}
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No outputs to other models</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Model Outputs:</h4>
                    {model.outputs && model.outputs.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {model.outputs.map((output, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                            <div className="font-medium">{output.name}</div>
                            <div className="text-gray-700">
                              {output.value} {output.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No outputs defined</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="optional">
        <Card>
          <CardHeader>
            <CardTitle>Optional Components</CardTitle>
            <CardDescription>Enable or disable optional models and modules in the workflow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Optional Models</h3>
                {modelGroups.filter((model) => model.optional).length > 0 ? (
                  <div className="space-y-4">
                    {modelGroups
                      .filter((model) => model.optional)
                      .map((model) => (
                        <div key={model.id} className={`border rounded-md p-3 ${!model.enabled ? "opacity-60" : ""}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{model.name}</h4>
                              <p className="text-sm text-gray-500">{model.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={model.enabled ? "default" : "outline"} className="text-xs">
                                {model.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              <Switch
                                checked={model.enabled}
                                onCheckedChange={() => handleToggleEnabled(model.id)}
                                aria-label={`${model.enabled ? "Disable" : "Enable"} ${model.name}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No optional models in the workflow.</p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Optional Modules</h3>
                {modelGroups.some((model) => model.modules && model.modules.some((m) => m.optional)) ? (
                  <div className="space-y-6">
                    {modelGroups
                      .filter((model) => model.modules && model.modules.some((m) => m.optional))
                      .map((model) => (
                        <div key={model.id} className="border-l-4 border-gray-200 pl-4">
                          <h4 className="font-medium mb-2">{model.name}</h4>
                          <div className="space-y-2">
                            {model.modules
                              .filter((module) => module.optional)
                              .map((module) => (
                                <div
                                  key={module.id}
                                  className={`p-2 border rounded-md ${!module.enabled ? "opacity-60" : ""}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-medium text-sm">{module.name}</div>
                                      <div className="text-xs text-gray-500">{module.description}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={module.enabled ? "default" : "outline"} className="text-xs">
                                        {module.enabled ? "Enabled" : "Disabled"}
                                      </Badge>
                                      <Switch
                                        checked={module.enabled}
                                        onCheckedChange={() => handleToggleModuleEnabled(model.id, module.id)}
                                        aria-label={`${module.enabled ? "Disable" : "Enable"} ${module.name}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No optional modules in the workflow.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="order">
        <Card>
          <CardHeader>
            <CardTitle>Sequential Execution Order</CardTitle>
            <CardDescription>
              Customize the order in which models and modules are executed when running in sequential mode. This order
              is used as a tiebreaker when models have the same dependency level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Model Execution Order</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop models to reorder them, or use the up/down buttons. This order is used as a tiebreaker
                  when models have the same dependency level.
                </p>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext items={executionOrder} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {executionOrder.map((modelId, index) => {
                        const model = modelGroups.find((m) => m.id === modelId)
                        if (!model) return null

                        return (
                          <SortableModelItem
                            key={model.id}
                            model={model}
                            index={index}
                            onToggleEnabled={handleToggleEnabled}
                            onMoveUp={handleMoveModelUp}
                            onMoveDown={handleMoveModelDown}
                            onToggleExpanded={toggleModelExpansion}
                            isExpanded={expandedModels[model.id]}
                          >
                            {model.modules && model.modules.length > 0 && (
                              <div className="mt-2 ml-8 mb-2">
                                <h4 className="text-sm font-medium mb-2">Module Execution Order</h4>
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleModuleDragEnd(model.id)}
                                  modifiers={[restrictToVerticalAxis]}
                                >
                                  <SortableContext
                                    items={moduleExecutionOrders[model.id] || model.modules.map((m) => m.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-1">
                                      {(moduleExecutionOrders[model.id] || model.modules.map((m) => m.id)).map(
                                        (moduleId, moduleIndex) => {
                                          const module = model.modules.find((m) => m.id === moduleId)
                                          if (!module) return null

                                          return (
                                            <SortableModuleItem
                                              key={module.id}
                                              module={module}
                                              modelId={model.id}
                                              index={moduleIndex}
                                              onToggleEnabled={handleToggleModuleEnabled}
                                              onMoveUp={handleMoveModuleUp}
                                              onMoveDown={handleMoveModuleDown}
                                            />
                                          )
                                        },
                                      )}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              </div>
                            )}
                          </SortableModelItem>
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
