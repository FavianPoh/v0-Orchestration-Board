"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useModelState } from "@/context/model-state-context"

export function OptimalExecutionSequence() {
  const [executionSequence, setExecutionSequence] = useState([])
  const [moduleExecutionSequence, setModuleExecutionSequence] = useState([])
  const [viewMode, setViewMode] = useState("sequential") // "sequential" or "parallel"
  const [executionMode, setExecutionMode] = useState("model") // "model" or "module"
  const { modelGroups, getExecutionSequence, getParallelExecutionGroups } = useModelState()

  // Calculate the execution sequence based on dependencies
  useEffect(() => {
    // Get the execution sequence from the context
    const sequence = getExecutionSequence()
    setExecutionSequence(sequence)

    // Now calculate module execution sequence
    const allModules = []
    const moduleDepMap = {}

    // First, collect all modules and their dependencies
    sequence.forEach((model) => {
      if (!model.modules) return

      const enabledModules = model.modules.filter((module) => module.enabled)
      enabledModules.forEach((module) => {
        allModules.push({
          ...module,
          modelId: model.id,
          modelName: model.name,
        })

        // Set up dependencies
        moduleDepMap[module.id] = module.dependencies || []
      })
    })

    // Calculate module levels
    const moduleCalculateLevels = () => {
      const levels = {}
      const visited = new Set()

      const calculateNodeLevel = (moduleId) => {
        if (visited.has(moduleId)) return levels[moduleId]

        visited.add(moduleId)

        const dependencies = moduleDepMap[moduleId] || []
        if (dependencies.length === 0) {
          levels[moduleId] = 0
          return 0
        }

        let maxLevel = -1
        for (const dependency of dependencies) {
          // Skip dependencies that are not in our enabled modules
          if (!allModules.find((m) => m.id === dependency)) continue

          const level = calculateNodeLevel(dependency)
          maxLevel = Math.max(maxLevel, level)
        }

        levels[moduleId] = maxLevel + 1
        return levels[moduleId]
      }

      // Calculate level for each module
      allModules.forEach((module) => {
        if (!visited.has(module.id)) {
          calculateNodeLevel(module.id)
        }
      })

      return levels
    }

    const moduleLevels = moduleCalculateLevels()

    // Group modules by level
    const modulesByLevel = {}
    allModules.forEach((module) => {
      const level = moduleLevels[module.id] || 0
      if (!modulesByLevel[level]) {
        modulesByLevel[level] = []
      }
      modulesByLevel[level].push(module)
    })

    // Create the final module execution sequence
    const moduleSequence = []
    const moduleLevelCount = Object.keys(modulesByLevel).length

    for (let i = 0; i < moduleLevelCount; i++) {
      const modulesInLevel = modulesByLevel[i] || []
      moduleSequence.push(...modulesInLevel)
    }

    setModuleExecutionSequence(moduleSequence)
  }, [modelGroups, getExecutionSequence])

  const getStatusBadge = (status) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Optimal Execution Sequence</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="view-mode">Sequential</Label>
              <Switch
                id="view-mode"
                checked={viewMode === "parallel"}
                onCheckedChange={(checked) => setViewMode(checked ? "parallel" : "sequential")}
              />
              <Label htmlFor="view-mode">Parallel</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="execution-mode">Models</Label>
              <Switch
                id="execution-mode"
                checked={executionMode === "module"}
                onCheckedChange={(checked) => setExecutionMode(checked ? "module" : "model")}
              />
              <Label htmlFor="execution-mode">Modules</Label>
            </div>
          </div>
        </div>
        <CardDescription>
          {viewMode === "sequential"
            ? "Sequential execution order based on dependencies"
            : "Parallel execution groups that can run simultaneously"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {executionMode === "model" ? (
          viewMode === "sequential" ? (
            <div className="space-y-2">
              {executionSequence.map((model, index) => (
                <div
                  key={model.id}
                  className={`flex justify-between items-center p-3 border rounded-md ${
                    model.id.startsWith("test-model-") ? "border-2 border-blue-500 dark:border-blue-400" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-muted text-muted-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <div>{model.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(model.status)}
                    {model.breakpoint && (
                      <Badge variant="outline" className="border-red-500 text-red-500">
                        <AlertCircle className="w-3 h-3 mr-1" /> Breakpoint
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Use the parallel execution groups from the context */}
              {(() => {
                const parallelGroups = getParallelExecutionGroups()

                return parallelGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="border rounded-md p-3">
                    <div className="text-sm font-medium mb-2">Execution Level {groupIndex + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.map((model) => (
                        <div
                          key={model.id}
                          className={`p-2 border rounded-md flex justify-between items-center ${
                            model.id.startsWith("test-model-") ? "border-2 border-blue-500 dark:border-blue-400" : ""
                          }`}
                        >
                          <div>{model.name}</div>
                          <div>{getStatusBadge(model.status)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )
        ) : // Module execution view
        viewMode === "sequential" ? (
          <div className="space-y-2">
            {moduleExecutionSequence.map((module, index) => (
              <div
                key={`${module.modelId}-${module.id}`}
                className="flex justify-between items-center p-3 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-muted text-muted-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <div>{module.name}</div>
                    <div className="text-xs text-muted-foreground">{module.modelName}</div>
                  </div>
                </div>
                <div>{getStatusBadge(module.status)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group modules by level and display them in parallel execution groups */}
            {(() => {
              // Create a map of modules by level
              const modulesByLevel = {}
              moduleExecutionSequence.forEach((module) => {
                // Calculate level based on dependencies
                let level = 0
                if (module.dependencies && module.dependencies.length > 0) {
                  // Find the max level of dependencies
                  const depLevels = module.dependencies
                    .map((depId) => {
                      const depIndex = moduleExecutionSequence.findIndex((m) => m.id === depId)
                      return depIndex >= 0 ? depIndex : -1
                    })
                    .filter((l) => l >= 0)

                  if (depLevels.length > 0) {
                    level = Math.max(...depLevels) + 1
                  }
                }

                if (!modulesByLevel[level]) {
                  modulesByLevel[level] = []
                }
                modulesByLevel[level].push(module)
              })

              // Render each level as a parallel execution group
              return Object.keys(modulesByLevel)
                .sort((a, b) => Number(a) - Number(b))
                .map((level) => (
                  <div key={level} className="border rounded-md p-3">
                    <div className="text-sm font-medium mb-2">Execution Level {Number(level) + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {modulesByLevel[level].map((module) => (
                        <div key={`${module.modelId}-${module.id}`} className="p-2 border rounded-md">
                          <div className="text-sm font-medium">{module.name}</div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">{module.modelName}</div>
                            <div>{getStatusBadge(module.status)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
