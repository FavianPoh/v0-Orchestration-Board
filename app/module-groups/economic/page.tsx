"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Play, Plus, Settings, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Sample data for Economic Models group
const economicModules = [
  {
    id: "eco-1",
    name: "GDP Calculator",
    description: "Calculates GDP based on economic inputs",
    status: "active",
    lastRun: "2 hours ago",
    inputs: [
      { name: "baseGDP", type: "number", value: 21500, unit: "billion USD" },
      { name: "growthRate", type: "number", value: 2.5, unit: "%" },
      { name: "inflationRate", type: "number", value: 3.2, unit: "%" },
    ],
    outputs: [
      { name: "projectedGDP", type: "number", value: 22037.5, unit: "billion USD" },
      { name: "realGrowth", type: "number", value: -0.7, unit: "%" },
    ],
  },
  {
    id: "eco-2",
    name: "Inflation Model",
    description: "Projects inflation based on economic factors",
    status: "active",
    lastRun: "3 hours ago",
    inputs: [
      { name: "currentInflation", type: "number", value: 3.2, unit: "%" },
      { name: "moneySupplyGrowth", type: "number", value: 4.5, unit: "%" },
      { name: "outputGap", type: "number", value: -0.8, unit: "%" },
    ],
    outputs: [{ name: "projectedInflation", type: "number", value: 3.45, unit: "%" }],
  },
  {
    id: "eco-3",
    name: "Employment Rate",
    description: "Calculates employment metrics",
    status: "active",
    lastRun: "3 hours ago",
    inputs: [
      { name: "laborForce", type: "number", value: 165, unit: "million" },
      { name: "employed", type: "number", value: 155, unit: "million" },
    ],
    outputs: [
      { name: "employmentRate", type: "number", value: 93.94, unit: "%" },
      { name: "unemploymentRate", type: "number", value: 6.06, unit: "%" },
    ],
  },
  {
    id: "eco-4",
    name: "Economic Indicators",
    description: "Aggregates key economic indicators",
    status: "inactive",
    lastRun: "1 day ago",
    inputs: [
      { name: "gdpGrowth", type: "number", value: 2.5, unit: "%" },
      { name: "inflation", type: "number", value: 3.2, unit: "%" },
      { name: "unemploymentRate", type: "number", value: 5.8, unit: "%" },
    ],
    outputs: [{ name: "economicHealthIndex", type: "number", value: 3.65, unit: "index" }],
  },
  {
    id: "eco-5",
    name: "Phillips Curve Analyzer",
    description: "Analyzes the nonlinear relationship between unemployment and inflation",
    status: "active",
    lastRun: "4 hours ago",
    inputs: [
      { name: "unemploymentRate", type: "number", value: 5.8, unit: "%" },
      { name: "naturalRate", type: "number", value: 4.5, unit: "%" },
      { name: "expectationCoefficient", type: "number", value: 0.7, unit: "" },
    ],
    outputs: [
      { name: "inflationChange", type: "number", value: 0.35, unit: "%" },
      { name: "expectedInflation", type: "number", value: 2.25, unit: "%" },
    ],
  },
  {
    id: "eco-6",
    name: "Okun's Law Calculator",
    description: "Calculates the nonlinear relationship between GDP growth and unemployment",
    status: "inactive",
    lastRun: "2 days ago",
    inputs: [
      { name: "gdpGrowth", type: "number", value: 2.5, unit: "%" },
      { name: "potentialGrowth", type: "number", value: 2.0, unit: "%" },
      { name: "okunCoefficient", type: "number", value: 0.4, unit: "" },
    ],
    outputs: [
      { name: "unemploymentChange", type: "number", value: -0.2, unit: "%" },
      { name: "outputGap", type: "number", value: 0.5, unit: "%" },
    ],
  },
]

export default function EconomicModelsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("modules")
  const [groupEnabled, setGroupEnabled] = useState(true)
  const [groupFrozen, setGroupFrozen] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "running":
        return <Badge className="bg-blue-500">Running</Badge>
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>
      default:
        return <Badge className="bg-gray-500">Inactive</Badge>
    }
  }

  const handleModuleClick = (moduleId: string) => {
    router.push(`/module-details/${moduleId}`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="ml-2">
          <h1 className="text-2xl font-bold">Economic Models</h1>
          <p className="text-muted-foreground">Manage economic modeling modules and their configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Economic Models Group</CardTitle>
              <CardDescription>Configure and manage modules in this group</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="modules">
                    <FileText className="mr-2 h-4 w-4" />
                    Modules
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="execution">
                    <Play className="mr-2 h-4 w-4" />
                    Execution
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="modules" className="mt-4">
                  <div className="space-y-4">
                    {economicModules.map((module) => (
                      <Card key={module.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleModuleClick(module.id)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium">{module.name}</h3>
                              {getStatusBadge(module.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Last run: {module.lastRun}</span>
                              <span>
                                {module.inputs.length} inputs, {module.outputs.length} outputs
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex justify-end mt-4">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Module
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Group Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="group-enabled">Enable Group</Label>
                          <Switch id="group-enabled" checked={groupEnabled} onCheckedChange={setGroupEnabled} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="group-frozen">Freeze Group</Label>
                          <Switch id="group-frozen" checked={groupFrozen} onCheckedChange={setGroupFrozen} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Dependencies</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm">This module group has no upstream dependencies.</p>
                        <p className="text-sm mt-2">Downstream dependencies:</p>
                        <ul className="list-disc pl-5 mt-1 text-sm">
                          <li>Financial Models</li>
                          <li>Risk Assessment</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Data Flow</h3>
                      <div className="bg-muted p-4 rounded-md h-[200px] flex items-center justify-center">
                        <p className="text-muted-foreground">Data flow visualization would appear here</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="execution" className="mt-4">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Execution History</h3>
                      <div className="space-y-2">
                        {[
                          { date: "Today, 14:30", status: "success", duration: "3.2s" },
                          { date: "Today, 12:15", status: "success", duration: "3.1s" },
                          { date: "Yesterday, 18:45", status: "failed", duration: "4.5s" },
                          { date: "Yesterday, 10:30", status: "success", duration: "3.0s" },
                        ].map((run, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                            <span>{run.date}</span>
                            <div className="flex items-center gap-4">
                              <span>{run.duration}</span>
                              <Badge className={run.status === "success" ? "bg-green-500" : "bg-red-500"}>
                                {run.status === "success" ? "Success" : "Failed"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Performance Metrics</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Average Run Time</div>
                            <div className="text-2xl font-bold">3.2s</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Success Rate</div>
                            <div className="text-2xl font-bold">92%</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Total Runs</div>
                            <div className="text-2xl font-bold">124</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>
                        <Play className="mr-2 h-4 w-4" />
                        Run All Modules
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Group Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Modules</span>
                    <span>{economicModules.length}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Active Modules</span>
                    <span>{economicModules.filter((m) => m.status === "active").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span>2 hours ago</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Module Health</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Active</span>
                        <span>
                          {economicModules.filter((m) => m.status === "active").length} / {economicModules.length}
                        </span>
                      </div>
                      <Progress
                        value={
                          (economicModules.filter((m) => m.status === "active").length / economicModules.length) * 100
                        }
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Success Rate</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Key Outputs</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>GDP Growth:</span>
                      <span className="font-medium">2.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Inflation:</span>
                      <span className="font-medium">3.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unemployment:</span>
                      <span className="font-medium">6.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start">
                  <Play className="mr-2 h-4 w-4" />
                  Run All Modules
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Module
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
