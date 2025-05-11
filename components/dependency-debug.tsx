"use client"

import { useState, useEffect } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

export function DependencyDebug() {
  const { modelGroups, getModelById, debugModelDependencyStatus, runModel, checkAndRunFinancialModels } =
    useModelState()
  const [refreshKey, setRefreshKey] = useState(0)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Target model ID
  const targetModelId = "financial-models"

  const refreshDebugInfo = () => {
    const info = debugModelDependencyStatus(targetModelId)
    setDebugInfo(info)
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    refreshDebugInfo()
    const interval = setInterval(refreshDebugInfo, 2000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status) => {
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
            <Clock className="w-3 h-3 mr-1 animate-spin" /> Running
          </Badge>
        )
      case "idle":
        return (
          <Badge className="bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3 mr-1" /> Idle
          </Badge>
        )
      case "disabled":
        return <Badge variant="outline">Disabled</Badge>
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" /> {status}
          </Badge>
        )
    }
  }

  const handleForceRun = () => {
    runModel(targetModelId)
  }

  if (!debugInfo) {
    return <div>Loading dependency information...</div>
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Financial Models Dependency Debug</span>
          <Button size="sm" onClick={refreshDebugInfo}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{debugInfo.model?.name} Status</h3>
            <div className="flex items-center mt-1">
              {getStatusBadge(debugInfo.model?.status)}
              <span className="ml-2 text-sm text-muted-foreground">
                {debugInfo.processed ? "Processed" : "Not Processed"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Dependencies</h3>
            <div className="mt-2 space-y-2">
              {debugInfo.dependencyStatus?.map((dep, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <span className="font-medium">{dep.name || dep.id}</span>
                    <div className="text-sm text-muted-foreground">ID: {dep.id}</div>
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(dep.status)}
                    <span className="ml-2 text-sm">{dep.enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleForceRun} className="w-full">
              Force Run Financial Models
            </Button>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              This will attempt to run the model regardless of dependency status
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={checkAndRunFinancialModels} variant="outline" className="w-full">
              Check & Run Financial Models
            </Button>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              This will verify dependencies and run only if all are satisfied
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
