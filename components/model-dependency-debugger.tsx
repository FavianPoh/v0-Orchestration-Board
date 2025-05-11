"use client"

import { useState, useEffect } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export function ModelDependencyDebugger() {
  const {
    modelGroups,
    getModelById,
    debugModelDependencyStatus,
    forceCompleteModel,
    getModelDependencies,
    getModelDependents,
  } = useModelState()

  const [selectedModelId, setSelectedModelId] = useState("financial-models")
  const [debugInfo, setDebugInfo] = useState(null)
  const [dependencyChain, setDependencyChain] = useState([])

  // Run debug on selected model
  useEffect(() => {
    if (selectedModelId) {
      const info = debugModelDependencyStatus(selectedModelId)
      setDebugInfo(info)

      // Build dependency chain
      const chain = []
      const model = getModelById(selectedModelId)

      if (model && model.dependencies) {
        model.dependencies.forEach((depId) => {
          const depModel = getModelById(depId)
          if (depModel) {
            chain.push({
              id: depId,
              name: depModel.name,
              status: depModel.status,
              enabled: depModel.enabled,
            })
          }
        })
      }

      setDependencyChain(chain)
    }
  }, [selectedModelId, modelGroups, debugModelDependencyStatus, getModelById])

  // Handle force complete
  const handleForceComplete = (modelId) => {
    forceCompleteModel(modelId)
    // Refresh debug info
    setTimeout(() => {
      const info = debugModelDependencyStatus(selectedModelId)
      setDebugInfo(info)
    }, 100)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Model Dependency Debugger</CardTitle>
        <CardDescription>Diagnose and fix dependency issues for Financial Models</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">Financial Models</h3>
            {debugInfo?.model && (
              <Badge variant={debugInfo.model.status === "completed" ? "success" : "outline"}>
                {debugInfo.model.status}
              </Badge>
            )}
          </div>

          {/* Dependency Chain */}
          <div className="border rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">Dependency Chain</h4>
            {dependencyChain.length > 0 ? (
              <div className="space-y-2">
                {dependencyChain.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{dep.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={dep.status === "completed" ? "success" : "outline"}>{dep.status}</Badge>
                      {dep.status !== "completed" && (
                        <Button size="sm" variant="outline" onClick={() => handleForceComplete(dep.id)}>
                          Force Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No dependencies found</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => debugModelDependencyStatus(selectedModelId)}>
              Refresh
            </Button>
            <Button onClick={() => handleForceComplete(selectedModelId)}>Force Complete Financial Models</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
