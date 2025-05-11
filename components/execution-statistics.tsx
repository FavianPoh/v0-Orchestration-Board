"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart } from "@/components/ui/chart"

export function ExecutionStatistics({ modelGroups = [] }) {
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate execution statistics
  const completedModels = modelGroups.filter((model) => model.status === "completed")
  const runningModels = modelGroups.filter((model) => model.status === "running")
  const pendingModels = modelGroups.filter((model) => model.status === "idle")
  const totalExecutionTime = completedModels.reduce((total, model) => total + (model.executionTime || 0), 0)

  // Generate execution time data for chart
  const executionTimeData = completedModels.map((model) => ({
    name: model.name,
    time: model.executionTime || 0,
  }))

  // Generate execution history data (simulated)
  const generateHistoryData = () => {
    const data = []
    const now = Date.now()
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      data.push({
        date,
        executionTime: Math.random() * 10 + 5, // Random execution time between 5-15 seconds
        modelCount: Math.floor(Math.random() * 5) + 3, // Random number of models between 3-7
      })
    }
    return data
  }

  const historyData = generateHistoryData()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Execution Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutionTime.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground">Last workflow run</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedModels.length}</div>
            <p className="text-xs text-muted-foreground">
              {((completedModels.length / modelGroups.length) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Running Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningModels.length}</div>
            <p className="text-xs text-muted-foreground">
              {((runningModels.length / modelGroups.length) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingModels.length}</div>
            <p className="text-xs text-muted-foreground">
              {((pendingModels.length / modelGroups.length) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Execution Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <BarChart
                data={executionTimeData}
                index="name"
                categories={["time"]}
                colors={["blue"]}
                valueFormatter={(value) => `${value.toFixed(2)}s`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Model Execution Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {modelGroups.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center">
                      <span className="font-medium">{model.name}</span>
                      <Badge className="ml-2" variant={model.status === "completed" ? "default" : "outline"}>
                        {model.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {model.executionTime ? `${model.executionTime.toFixed(2)}s` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {model.endTime ? `Completed ${new Date(model.endTime).toLocaleTimeString()}` : "Not executed"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChart
                data={historyData}
                index="date"
                categories={["executionTime"]}
                colors={["blue"]}
                valueFormatter={(value) => `${value.toFixed(2)}s`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Count History</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChart
                data={historyData}
                index="date"
                categories={["modelCount"]}
                colors={["green"]}
                valueFormatter={(value) => `${value} models`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
