"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart, LineChart } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"

type ModuleBreakdownProps = {
  modelGroups: any[]
  selectedModelId: string | null
  onSelectModel: (id: string) => void
}

export function ModuleBreakdown({ modelGroups, selectedModelId, onSelectModel }: ModuleBreakdownProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMetric, setSelectedMetric] = useState("outputs")

  // Find the selected model group
  const selectedModel = selectedModelId ? modelGroups.find((group) => group.id === selectedModelId) : modelGroups[0]

  if (!selectedModel) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[600px]">
          <CardHeader>
            <CardTitle>Module Breakdown</CardTitle>
            <CardDescription>Select a module group from the dependency graph to view details</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Status colors
  const statusColors = {
    completed: "bg-green-500",
    running: "bg-blue-500",
    paused: "bg-yellow-500",
    idle: "bg-gray-400",
    error: "bg-red-500",
  }

  // Generate sample historical data for charts
  const generateHistoricalData = (outputs, days = 30) => {
    return outputs.map((output) => {
      const baseValue = Number.parseFloat(output.value.replace(/,/g, ""))
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
  }

  // Generate sample performance data
  const generatePerformanceData = () => {
    return {
      executionTime: [
        { name: "Last Run", value: selectedModel.executionTime || Math.random() * 10 + 2 },
        { name: "Average", value: Math.random() * 10 + 3 },
        { name: "Maximum", value: Math.random() * 15 + 5 },
      ],
      resourceUsage: [
        { name: "CPU", value: Math.random() * 80 + 20 },
        { name: "Memory", value: Math.random() * 60 + 30 },
        { name: "I/O", value: Math.random() * 50 + 10 },
      ],
      waitTime: [
        { name: "Last Run", value: selectedModel.waitTime || Math.random() * 5 + 1 },
        { name: "Average", value: Math.random() * 5 + 2 },
        { name: "Maximum", value: Math.random() * 10 + 3 },
      ],
    }
  }

  const historicalData = generateHistoricalData(selectedModel.outputs || [])
  const performanceData = generatePerformanceData()

  return (
    <div className="w-full">
      <div className="p-6 h-full overflow-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{selectedModel.name} Breakdown</h2>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${statusColors[selectedModel.status] || "bg-gray-400"}`}></div>
              <span className="text-sm capitalize mr-4">{selectedModel.status}</span>
              {selectedModel.progress > 0 && selectedModel.progress < 100 && (
                <Progress value={selectedModel.progress} className="w-40 h-2" />
              )}
            </div>
          </div>
          <Select value={selectedModelId || ""} onValueChange={onSelectModel}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a model group" />
            </SelectTrigger>
            <SelectContent>
              {modelGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${statusColors[selectedModel.status] || "bg-gray-400"}`}
                    ></div>
                    <span className="text-lg font-medium capitalize">{selectedModel.status}</span>
                  </div>
                  {selectedModel.progress > 0 && (
                    <div className="mt-2">
                      <Progress value={selectedModel.progress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-1">{selectedModel.progress}% complete</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Execution Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span className="text-lg font-medium">
                      {selectedModel.executionTime ? `${selectedModel.executionTime.toFixed(2)}s` : "Not executed"}
                    </span>
                  </div>
                  {selectedModel.startTime && selectedModel.endTime && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedModel.startTime).toLocaleTimeString()} -{" "}
                      {new Date(selectedModel.endTime).toLocaleTimeString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Outputs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedModel.outputs?.map((output, index) => (
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
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {selectedModel.modules?.map((module, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                      <Badge variant="outline">Module {index + 1}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Inputs</h4>
                        {module.inputs?.map((input, idx) => (
                          <div key={idx} className="flex justify-between items-center mb-1 text-sm">
                            <span className="text-muted-foreground">{input.name}:</span>
                            <span>
                              {input.value}{" "}
                              {input.unit && <span className="text-xs text-muted-foreground">{input.unit}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Outputs</h4>
                        {module.outputs?.map((output, idx) => (
                          <div key={idx} className="flex justify-between items-center mb-1 text-sm">
                            <span className="text-muted-foreground">{output.name}:</span>
                            <span>
                              {output.value}{" "}
                              {output.unit && <span className="text-xs text-muted-foreground">{output.unit}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Execution Time (seconds)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <BarChart
                    data={performanceData.executionTime}
                    index="name"
                    categories={["value"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value.toFixed(2)}s`}
                    showLegend={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Resource Usage (%)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <BarChart
                    data={performanceData.resourceUsage}
                    index="name"
                    categories={["value"]}
                    colors={["green"]}
                    valueFormatter={(value) => `${value.toFixed(1)}%`}
                    showLegend={false}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Wait Time (seconds)</CardTitle>
                  <CardDescription>Time spent waiting for dependencies</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <BarChart
                    data={performanceData.waitTime}
                    index="name"
                    categories={["value"]}
                    colors={["orange"]}
                    valueFormatter={(value) => `${value.toFixed(2)}s`}
                    showLegend={false}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Historical Data</h3>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outputs">Outputs</SelectItem>
                  <SelectItem value="executionTime">Execution Time</SelectItem>
                  <SelectItem value="resourceUsage">Resource Usage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMetric === "outputs" && (
              <div className="grid grid-cols-1 gap-6">
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
            )}

            {selectedMetric === "executionTime" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Execution Time History</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <LineChart
                    data={[...Array(30)].map((_, i) => ({
                      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                      value: Math.random() * 10 + 2,
                    }))}
                    index="date"
                    categories={["value"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value.toFixed(2)}s`}
                    showLegend={false}
                  />
                </CardContent>
              </Card>
            )}

            {selectedMetric === "resourceUsage" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Resource Usage History</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <LineChart
                    data={[...Array(30)].map((_, i) => ({
                      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                      cpu: Math.random() * 80 + 20,
                      memory: Math.random() * 60 + 30,
                      io: Math.random() * 50 + 10,
                    }))}
                    index="date"
                    categories={["cpu", "memory", "io"]}
                    colors={["blue", "green", "orange"]}
                    valueFormatter={(value) => `${value.toFixed(1)}%`}
                    showLegend={true}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
