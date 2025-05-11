"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export function Dependencies({ modelGroups = [], dependencyConfig = {}, onUpdateDependencyConfig }) {
  const [activeTab, setActiveTab] = useState("run-sequence")
  const [analyzedDependencies, setAnalyzedDependencies] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [impactChain, setImpactChain] = useState([])
  const [selectedModelId, setSelectedModelId] = useState("")
  const [selectedSourceId, setSelectedSourceId] = useState("")
  const [condition, setCondition] = useState("")
  const [operator, setOperator] = useState(">")
  const [value, setValue] = useState("")
  const [action, setAction] = useState("run")
  const [localModelGroups, setLocalModelGroups] = useState([])

  // Initialize local state from props
  useEffect(() => {
    setLocalModelGroups(modelGroups)
  }, [modelGroups])

  // Analyze dependencies based on model inputs and outputs
  const analyzeDependencies = () => {
    // Filter out disabled optional models
    const enabledModels = localModelGroups.filter((model) => !model.optional || model.enabled)

    // Create a map of output parameters to source models
    const outputMap = {}
    enabledModels.forEach((model) => {
      if (model.outputs) {
        model.outputs.forEach((output) => {
          outputMap[output.name] = outputMap[output.name] || []
          outputMap[output.name].push(model.id)
        })
      }
    })

    // Create a map of input parameters to models that use them
    const inputMap = {}
    enabledModels.forEach((model) => {
      if (model.modules) {
        model.modules.forEach((module) => {
          if (module.inputs) {
            module.inputs.forEach((input) => {
              inputMap[input.name] = inputMap[input.name] || []
              inputMap[input.name].push(model.id)
            })
          }
        })
      }
    })

    // Determine dependencies based on matching inputs and outputs
    const newDependencies = {}
    enabledModels.forEach((model) => {
      newDependencies[model.id] = { dependencies: [] }

      // Check if any of this model's inputs match outputs from other models
      if (model.modules) {
        model.modules.forEach((module) => {
          if (module.inputs) {
            module.inputs.forEach((input) => {
              const possibleSources = outputMap[input.name] || []
              possibleSources.forEach((sourceId) => {
                if (sourceId !== model.id && !newDependencies[model.id].dependencies.includes(sourceId)) {
                  newDependencies[model.id].dependencies.push(sourceId)
                }
              })
            })
          }
        })
      }
    })

    // Add priority based on dependency depth
    const priorityMap = {}
    const calculatePriority = (modelId, visited = new Set()) => {
      if (visited.has(modelId)) return 0
      visited.add(modelId)

      const deps = newDependencies[modelId]?.dependencies || []
      if (deps.length === 0) return 0

      let maxDepth = 0
      deps.forEach((depId) => {
        const depDepth = calculatePriority(depId, new Set(visited)) + 1
        maxDepth = Math.max(maxDepth, depDepth)
      })

      priorityMap[modelId] = maxDepth
      return maxDepth
    }

    enabledModels.forEach((model) => {
      calculatePriority(model.id)
      newDependencies[model.id].priority = priorityMap[model.id] || 0
    })

    setAnalyzedDependencies(newDependencies)
    return newDependencies
  }

  // Apply the analyzed dependencies to the actual config
  const applyAnalyzedDependencies = () => {
    if (!analyzedDependencies) return

    // Merge with existing config to preserve conditional dependencies
    const newConfig = { ...dependencyConfig }
    Object.keys(analyzedDependencies).forEach((modelId) => {
      newConfig[modelId] = {
        ...newConfig[modelId],
        dependencies: analyzedDependencies[modelId].dependencies,
        priority: analyzedDependencies[modelId].priority,
      }
    })

    onUpdateDependencyConfig(newConfig)
  }

  // Analyze impact chain for a selected model
  const analyzeImpactChain = (modelId) => {
    const model = localModelGroups.find((m) => m.id === modelId)
    if (!model) return

    setSelectedModel(model)

    // Find upstream dependencies (what affects this model)
    const upstream = []
    const findUpstream = (id) => {
      const deps = dependencyConfig[id]?.dependencies || []
      deps.forEach((depId) => {
        const depModel = localModelGroups.find((m) => m.id === depId)
        if (depModel && !upstream.some((m) => m.id === depId)) {
          upstream.push(depModel)
          findUpstream(depId)
        }
      })
    }
    findUpstream(modelId)

    // Find downstream impacts (what this model affects)
    const downstream = []
    const findDownstream = (id) => {
      localModelGroups.forEach((m) => {
        const deps = dependencyConfig[m.id]?.dependencies || []
        if (deps.includes(id) && !downstream.some((dm) => dm.id === m.id)) {
          downstream.push(m)
          findDownstream(m.id)
        }
      })
    }
    findDownstream(modelId)

    setImpactChain({ upstream, downstream })
  }

  const handleAddCondition = () => {
    if (!selectedModelId || !selectedSourceId || !condition || !value) return

    const newConfig = { ...dependencyConfig }

    if (!newConfig[selectedModelId]) {
      newConfig[selectedModelId] = {
        dependencies: [],
        conditionalDependencies: [],
        estimatedDuration: 5,
        parallelizable: false,
      }
    }

    if (!newConfig[selectedModelId].conditionalDependencies) {
      newConfig[selectedModelId].conditionalDependencies = []
    }

    newConfig[selectedModelId].conditionalDependencies.push({
      sourceId: selectedSourceId,
      condition,
      value,
      operator,
      action,
    })

    onUpdateDependencyConfig(newConfig)

    // Reset form
    setCondition("")
    setValue("")
  }

  const handleRemoveCondition = (modelId, index) => {
    const newConfig = { ...dependencyConfig }
    newConfig[modelId].conditionalDependencies.splice(index, 1)
    onUpdateDependencyConfig(newConfig)
  }

  const handleAddDependency = () => {
    if (!selectedModelId || !selectedSourceId) return

    const newConfig = { ...dependencyConfig }

    if (!newConfig[selectedModelId]) {
      newConfig[selectedModelId] = {
        dependencies: [],
        conditionalDependencies: [],
        estimatedDuration: 5,
        parallelizable: false,
      }
    }

    if (!newConfig[selectedModelId].dependencies.includes(selectedSourceId)) {
      newConfig[selectedModelId].dependencies.push(selectedSourceId)
    }

    onUpdateDependencyConfig(newConfig)
  }

  const handleRemoveDependency = (modelId, depId) => {
    const newConfig = { ...dependencyConfig }
    newConfig[modelId].dependencies = newConfig[modelId].dependencies.filter((id) => id !== depId)
    onUpdateDependencyConfig(newConfig)
  }

  // Toggle optional model
  const handleToggleOptionalModel = (modelId) => {
    setLocalModelGroups((prevGroups) => {
      const updatedGroups = prevGroups.map((model) => {
        if (model.id === modelId) {
          return {
            ...model,
            enabled: !model.enabled,
            status: !model.enabled ? "idle" : "disabled",
          }
        }
        return model
      })

      // Re-analyze dependencies with the updated model state
      setTimeout(() => analyzeDependencies(), 0)

      return updatedGroups
    })
  }

  // Auto-analyze on component mount or when model groups change
  useEffect(() => {
    analyzeDependencies()
  }, [localModelGroups])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="run-sequence">Run Sequence</TabsTrigger>
        <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
        <TabsTrigger value="conditional">Conditional</TabsTrigger>
        <TabsTrigger value="priority">Priority</TabsTrigger>
      </TabsList>

      <TabsContent value="run-sequence">
        <div className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Automatic Dependency Detection</AlertTitle>
            <AlertDescription>
              Dependencies are automatically detected based on matching inputs and outputs between models.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between">
            <Button onClick={analyzeDependencies} variant="outline">
              Re-Analyze Dependencies
            </Button>
            <Button onClick={applyAnalyzedDependencies}>Apply Detected Dependencies</Button>
          </div>

          <div className="mt-4 border p-4 rounded-md">
            <h3 className="text-sm font-medium mb-3">Optional Models</h3>
            <div className="space-y-2">
              {localModelGroups
                .filter((model) => model.optional)
                .map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center">
                      <span>{model.name}</span>
                      <Badge variant="outline" className="ml-2">
                        Optional
                      </Badge>
                    </div>
                    <Switch checked={model.enabled} onCheckedChange={() => handleToggleOptionalModel(model.id)} />
                  </div>
                ))}
            </div>
          </div>

          {analyzedDependencies && (
            <div className="mt-4 space-y-4">
              <h3 className="text-sm font-medium">Detected Run Sequence</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {Object.keys(analyzedDependencies).map((modelId) => {
                  const model = localModelGroups.find((m) => m.id === modelId)
                  const deps = analyzedDependencies[modelId].dependencies
                  if (!model) return null

                  // Skip disabled optional models
                  if (model.optional && !model.enabled) return null

                  return (
                    <div key={modelId} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium flex items-center">
                          {model.name}
                          {model.optional && (
                            <Badge variant="outline" className="ml-2">
                              Optional
                            </Badge>
                          )}
                        </h4>
                        <Badge>Priority: {analyzedDependencies[modelId].priority}</Badge>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Depends on:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {deps.length > 0 ? (
                            deps.map((depId) => {
                              const depModel = localModelGroups.find((m) => m.id === depId)
                              return (
                                <Badge key={depId} variant="outline">
                                  {depModel?.name || depId}
                                </Badge>
                              )
                            })
                          ) : (
                            <span className="text-sm text-muted-foreground">No dependencies</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="impact">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {localModelGroups.map((model) => (
              <Button
                key={model.id}
                variant={selectedModel?.id === model.id ? "default" : "outline"}
                className={`justify-start ${model.optional && !model.enabled ? "opacity-60" : ""}`}
                onClick={() => analyzeImpactChain(model.id)}
                disabled={model.optional && !model.enabled}
              >
                <div className="flex items-center">
                  {model.name}
                  {model.optional && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Optional
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {selectedModel && impactChain && (
            <div className="mt-6 space-y-4">
              <div className="border p-4 rounded-md bg-muted/50">
                <h3 className="text-lg font-medium mb-2">Impact Chain for {selectedModel.name}</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Upstream (Affects This Model)</h4>
                    {impactChain.upstream.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No upstream dependencies</div>
                    ) : (
                      <div className="space-y-2">
                        {impactChain.upstream.map((model) => (
                          <Badge key={model.id} variant="outline" className="w-full justify-start">
                            {model.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      <Badge className="mt-2">{selectedModel.name}</Badge>
                      <ArrowRight className="h-6 w-6 text-muted-foreground mt-2" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Downstream (Affected by This Model)</h4>
                    {impactChain.downstream.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No downstream impacts</div>
                    ) : (
                      <div className="space-y-2">
                        {impactChain.downstream.map((model) => (
                          <Badge key={model.id} variant="outline" className="w-full justify-start">
                            {model.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2">Metric Impact Analysis</h4>
                {selectedModel.outputs && selectedModel.outputs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedModel.outputs.map((output, idx) => (
                      <div key={idx} className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {output.name}: {output.value} {output.unit}
                          </span>
                          <Badge variant="outline">Output</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          This metric affects {impactChain.downstream.length} downstream models
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No output metrics available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="conditional">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cond-target-model">Target Model</Label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                <SelectTrigger id="cond-target-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {localModelGroups
                    .filter((model) => !model.optional || model.enabled)
                    .map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cond-source-model">Source Model</Label>
              <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                <SelectTrigger id="cond-source-model">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {localModelGroups
                    .filter((model) => model.id !== selectedModelId && (!model.optional || model.enabled))
                    .map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="condition">Output Field</Label>
              <Input
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g., GDP Growth"
              />
            </div>
            <div>
              <Label htmlFor="operator">Operator</Label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger id="operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=">">Greater than</SelectItem>
                  <SelectItem value="<">Less than</SelectItem>
                  <SelectItem value=">=">Greater or equal</SelectItem>
                  <SelectItem value="<=">Less or equal</SelectItem>
                  <SelectItem value="==">Equal to</SelectItem>
                  <SelectItem value="!=">Not equal to</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="value">Value</Label>
              <Input id="value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g., 2.5" />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="run">Run</SelectItem>
                  <SelectItem value="skip">Skip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAddCondition}>Add Condition</Button>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Current Conditional Dependencies</h3>
            <div className="space-y-2">
              {localModelGroups.map((model) => {
                const conditions = dependencyConfig[model.id]?.conditionalDependencies || []
                if (conditions.length === 0) return null

                return (
                  <div key={model.id} className="border p-3 rounded-md">
                    <h4 className="font-medium">{model.name}</h4>
                    <div className="space-y-2 mt-2">
                      {conditions.map((cond, index) => {
                        const sourceModel = localModelGroups.find((m) => m.id === cond.sourceId)
                        return (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                            <span className="text-sm">
                              If <Badge variant="outline">{sourceModel?.name || cond.sourceId}</Badge>'s{" "}
                              <Badge variant="outline">{cond.condition}</Badge> {cond.operator}{" "}
                              <Badge variant="outline">{cond.value}</Badge> then <Badge>{cond.action}</Badge>
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveCondition(model.id, index)}>
                              Remove
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="priority">
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-4">Model Execution Priority</h3>
            <div className="space-y-4">
              {localModelGroups
                .filter((model) => !model.optional || model.enabled)
                .map((model) => {
                  const priority = dependencyConfig[model.id]?.priority || 0
                  return (
                    <div key={model.id} className="flex items-center justify-between">
                      <span className="flex items-center">
                        {model.name}
                        {model.optional && (
                          <Badge variant="outline" className="ml-2">
                            Optional
                          </Badge>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <Select
                          value={priority.toString()}
                          onValueChange={(value) => {
                            const newConfig = { ...dependencyConfig }
                            if (!newConfig[model.id]) {
                              newConfig[model.id] = { dependencies: [], priority: Number.parseInt(value) }
                            } else {
                              newConfig[model.id].priority = Number.parseInt(value)
                            }
                            onUpdateDependencyConfig(newConfig)
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 (Low)</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5 (High)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant={priority > 3 ? "default" : "outline"}>
                          {priority > 3 ? "High" : priority > 1 ? "Medium" : "Low"}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
