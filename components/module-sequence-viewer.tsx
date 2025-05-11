"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ModuleSequenceViewer({ modelGroup }) {
  const [view, setView] = useState("sequence")

  if (!modelGroup || !modelGroup.modules) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No modules available for this model group.</div>
        </CardContent>
      </Card>
    )
  }

  // Sort modules by their execution order
  // In a real app, this would come from the backend
  const sortedModules = [...modelGroup.modules].sort((a, b) => {
    // First by status (completed first, then running, then idle)
    const statusOrder = { completed: 0, running: 1, idle: 2, error: 3 }
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }

    // Then by name if status is the same
    return a.name.localeCompare(b.name)
  })

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "running":
        return "bg-blue-500"
      case "paused":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // Render sequence view
  const renderSequenceView = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center">
          {sortedModules.map((module, index) => (
            <div key={module.id} className="w-full">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center border">{index + 1}</div>
                <div className="ml-3 flex-1">
                  <Card className="w-full">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{module.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {module.description || "Processes data and generates outputs"}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {module.optional && (
                          <Badge variant="outline" className="mr-2">
                            Optional
                          </Badge>
                        )}
                        <Badge className={getStatusColor(module.status)}>{module.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {index < sortedModules.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowDown className="text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render dependency view
  const renderDependencyView = () => {
    // In a real app, this would come from the backend
    // For now, we'll create some sample dependencies
    const dependencies = sortedModules.map((module, index) => {
      return {
        id: module.id,
        name: module.name,
        dependencies: index > 0 ? [sortedModules[index - 1].id] : [],
      }
    })

    return (
      <div className="space-y-4">
        {dependencies.map((module) => (
          <Card key={module.id}>
            <CardContent className="p-4">
              <div className="font-medium">{module.name}</div>
              <div className="mt-2">
                <div className="text-sm text-muted-foreground">Dependencies:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {module.dependencies.length > 0 ? (
                    module.dependencies.map((depId) => {
                      const depModule = sortedModules.find((m) => m.id === depId)
                      return (
                        <Badge key={depId} variant="outline">
                          {depModule?.name || depId}
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground">No dependencies</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Sequence for {modelGroup.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={setView} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sequence">Execution Sequence</TabsTrigger>
            <TabsTrigger value="dependencies">Module Dependencies</TabsTrigger>
          </TabsList>
          <TabsContent value="sequence" className="mt-4">
            {renderSequenceView()}
          </TabsContent>
          <TabsContent value="dependencies" className="mt-4">
            {renderDependencyView()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
