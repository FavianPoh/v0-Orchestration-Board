"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, Pause, SkipForward, Settings, FileText, BarChart } from "lucide-react"
import { LineChart } from "@/components/ui/chart"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Dependencies } from "@/components/dependencies"
import { toast } from "@/components/ui/use-toast"
import { ModuleSequenceViewer } from "@/components/module-sequence-viewer"
import { useModelState } from "@/context/model-state-context"

export default function ModelGroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [modelGroup, setModelGroup] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [dependencyConfig, setDependencyConfig] = useState({})
  const { getModelById, updateModelGroup, updateModuleInGroup } = useModelState()

  useEffect(() => {
    const modelId = params.id
    if (modelId) {
      const model = getModelById(modelId)
      if (model) {
        setModelGroup(model)

        // Generate sample historical data for charts
        const generateHistoricalData = (outputs, days = 30) => {
          return outputs
            .map((output) => {
              const baseValue = Number.parseFloat(output.value.replace(/,/g, ""))
              if (isNaN(baseValue)) return null

              const data = []
              for (let i = days; i >= 0; i--) {
                // Generate a value that fluctuates around the base value
                const fluctuation = (Math.random() - 0.5) * 0.2 * baseValue
                const value = Math.max(0, baseValue + fluctuation * (1 - i / days))
                data.push({
                  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  value: value.toFixed(2),
                })
              }

              return {
                name: output.name,
                data,
                unit: output.unit,
              }
            })
            .filter(Boolean)
        }

        setHistoricalData(generateHistoricalData(model.outputs || []))
      }
    }
  }, [params.id, getModelById])

  if (!modelGroup) {
    return <div className="container mx-auto p-6">Model Group not found</div>
  }

  // Status colors
  const statusColors = {
    completed: "bg-green-500",
    running: "bg-blue-500",
    paused: "bg-yellow-500",
    idle: "bg-gray-500",
    error: "bg-red-500",
  }

  const handleToggleModule = (moduleId) => {
    const updatedModules = modelGroup.modules.map((module) => {
      if (module.id === moduleId) {
        const newEnabled = !module.enabled

        // Update the module in the global state
        updateModuleInGroup(modelGroup.id, moduleId, { enabled: newEnabled })

        // Show toast notification
        toast({
          title: `${module.name} ${newEnabled ? "enabled" : "disabled"}`,
          description: `The module has been ${newEnabled ? "added to" : "removed from"} the execution sequence.`,
        })

        return { ...module, enabled: newEnabled }
      }
      return module
    })

    // Update local state
    setModelGroup((prev) => ({ ...prev, modules: updatedModules }))
  }

  const handleToggleEnabled = () => {
    const newEnabled = !modelGroup.enabled

    // Update the model in the global state
    updateModelGroup(modelGroup.id, {
      enabled: newEnabled,
      status: newEnabled ? "idle" : "disabled",
    })

    // Update local state
    setModelGroup((prev) => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? "idle" : "disabled",
    }))

    toast({
      title: `${modelGroup.name} ${newEnabled ? "enabled" : "disabled"}`,
      description: `The model has been ${newEnabled ? "added to" : "removed from"} the workflow sequence.`,
    })
  }

  const handleToggleBreakpoint = () => {
    const newBreakpoint = !modelGroup.breakpoint

    // Update the model in the global state
    updateModelGroup(modelGroup.id, { breakpoint: newBreakpoint })

    // Update local state
    setModelGroup((prev) => ({ ...prev, breakpoint: newBreakpoint }))

    toast({
      title: `Breakpoint ${newBreakpoint ? "set" : "removed"}`,
      description: `Execution will ${newBreakpoint ? "pause" : "not pause"} before this model group.`,
    })
  }

  const handleToggleFrozen = () => {
    const newFrozen = !modelGroup.frozen

    // Update the model in the global state
    updateModelGroup(modelGroup.id, { frozen: newFrozen })

    // Update local state
    setModelGroup((prev) => ({ ...prev, frozen: newFrozen }))

    toast({
      title: `Outputs ${newFrozen ? "frozen" : "unfrozen"}`,
      description: `Output values will ${newFrozen ? "not" : ""} be updated when the model runs.`,
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/workflows")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workflows
        </Button>
        <div className="ml-2">
          <h1 className="text-2xl font-bold">{modelGroup.name}</h1>
          <div className="flex items-center mt-1">
            <div className={`w-2 h-2 rounded-full mr-2 ${statusColors[modelGroup.status]}`}></div>
            <span className="text-sm capitalize mr-4">{modelGroup.status}</span>
            {modelGroup.progress > 0 && modelGroup.progress < 100 && (
              <Progress value={modelGroup.progress} className="w-40 h-2" />
            )}
            {modelGroup.optional && (
              <Badge variant="outline" className="ml-2">
                Optional
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Model Group Details</CardTitle>
              <CardDescription>{modelGroup.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">
                    <FileText className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="modules">
                    <Settings className="mr-2 h-4 w-4" />
                    Modules
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <BarChart className="mr-2 h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${statusColors[modelGroup.status]}`}></div>
                            <span className="text-lg font-medium capitalize">{modelGroup.status}</span>
                          </div>
                          {modelGroup.progress > 0 && (
                            <div className="mt-2">
                              <Progress value={modelGroup.progress} className="h-2" />
                              <p className="text-sm text-muted-foreground mt-1">{modelGroup.progress}% complete</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="enabled">Enabled</Label>
                              <Switch
                                id="enabled"
                                checked={modelGroup.enabled}
                                onCheckedChange={handleToggleEnabled}
                                disabled={!modelGroup.optional && modelGroup.enabled}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="breakpoint">Breakpoint</Label>
                              <Switch
                                id="breakpoint"
                                checked={modelGroup.breakpoint}
                                onCheckedChange={handleToggleBreakpoint}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="priority">Priority</Label>
                              <Badge>{modelGroup.priority}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Outputs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {modelGroup.outputs?.map((output, index) => (
                            <div key={index} className="bg-muted p-3 rounded-md">
                              <p className="text-sm text-muted-foreground">{output.name}</p>
                              <p className="text-lg font-medium">
                                {output.value}{" "}
                                {output.unit && <span className="text-sm text-muted-foreground">{output.unit}</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Execution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Execution Time</p>
                            <p className="text-lg font-medium">
                              {modelGroup.executionTime ? `${modelGroup.executionTime.toFixed(2)}s` : "Not executed"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Last Run</p>
                            <p className="text-lg font-medium">
                              {modelGroup.endTime ? new Date(modelGroup.endTime).toLocaleString() : "Not executed"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="modules" className="mt-4">
                  <div className="space-y-4">
                    {modelGroup.modules?.map((module, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center">
                              {module.name}
                              {module.optional && (
                                <Badge variant="outline" className="ml-2">
                                  Optional
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge className={statusColors[module.status]}>{module.status}</Badge>
                              <Switch
                                checked={module.enabled}
                                onCheckedChange={() => handleToggleModule(module.id)}
                                disabled={!module.optional && module.enabled}
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/module-details/${module.id}`)}
                            >
                              View Module Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Execution History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <LineChart
                            data={[...Array(30)].map((_, i) => ({
                              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                              time: Math.random() * 5 + 1,
                            }))}
                            index="date"
                            categories={["time"]}
                            colors={["blue"]}
                            valueFormatter={(value) => `${value.toFixed(2)}s`}
                            showLegend={false}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {historicalData.map((series, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">
                            {series.name} {series.unit && `(${series.unit})`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                          <LineChart
                            data={series.data}
                            index="date"
                            categories={["value"]}
                            colors={["blue"]}
                            valueFormatter={(value) => `${value} ${series.unit}`}
                            showLegend={false}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Module Sequence</CardTitle>
              <CardDescription>View the execution sequence of modules within this model group</CardDescription>
            </CardHeader>
            <CardContent>
              <ModuleSequenceViewer modelGroup={modelGroup} />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
              <CardDescription>Configure model dependencies and execution sequence</CardDescription>
            </CardHeader>
            <CardContent>
              <Dependencies
                modelGroups={[modelGroup]}
                dependencyConfig={dependencyConfig}
                onUpdateDependencyConfig={setDependencyConfig}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Manage model group execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button className="w-full" disabled={modelGroup.status === "completed"}>
                    <Play className="mr-2 h-4 w-4" />
                    Run
                  </Button>
                  <Button variant="outline" className="w-full" disabled={modelGroup.status !== "running"}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                </div>

                <Button variant="outline" className="w-full" disabled={!modelGroup.breakpoint}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip Breakpoint
                </Button>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="control-enabled">Enabled</Label>
                    <Switch
                      id="control-enabled"
                      checked={modelGroup.enabled}
                      onCheckedChange={handleToggleEnabled}
                      disabled={!modelGroup.optional && modelGroup.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="control-breakpoint">Breakpoint</Label>
                    <Switch
                      id="control-breakpoint"
                      checked={modelGroup.breakpoint}
                      onCheckedChange={handleToggleBreakpoint}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="control-frozen">Freeze Outputs</Label>
                    <Switch id="control-frozen" checked={modelGroup.frozen} onCheckedChange={handleToggleFrozen} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Module Status</CardTitle>
              <CardDescription>Status of individual modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {modelGroup.modules?.map((module, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => router.push(`/module-details/${module.id}`)}
                    >
                      {module.name}
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[module.status]}>{module.status}</Badge>
                      {module.optional && (
                        <Switch
                          size="sm"
                          checked={module.enabled}
                          onCheckedChange={() => handleToggleModule(module.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
