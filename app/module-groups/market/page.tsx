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

// Sample data for Market Analysis group
const marketModules = [
  {
    id: "market-1",
    name: "Market Segmentation",
    description: "Segments the market based on demographic and behavioral factors",
    status: "active",
    lastRun: "3 hours ago",
    inputs: [
      { name: "demographicData", type: "object", value: { age: 35, income: 75000, education: "college" }, unit: "" },
      { name: "behavioralData", type: "object", value: { frequency: 2.5, loyalty: 0.7, engagement: 0.8 }, unit: "" },
    ],
    outputs: [
      { name: "segmentId", type: "string", value: "Premium", unit: "" },
      { name: "segmentScore", type: "number", value: 0.82, unit: "score" },
    ],
  },
  {
    id: "market-2",
    name: "Price Elasticity Calculator",
    description: "Calculates price elasticity of demand",
    status: "active",
    lastRun: "4 hours ago",
    inputs: [
      { name: "initialPrice", type: "number", value: 100, unit: "USD" },
      { name: "initialQuantity", type: "number", value: 1000, unit: "units" },
      { name: "priceChange", type: "number", value: 10, unit: "%" },
      { name: "luxuryFactor", type: "number", value: 0.5, unit: "score" },
    ],
    outputs: [
      { name: "elasticity", type: "number", value: -1.05, unit: "" },
      { name: "projectedQuantity", type: "number", value: 900, unit: "units" },
      { name: "revenueChange", type: "number", value: -1.0, unit: "%" },
    ],
  },
  {
    id: "market-3",
    name: "Diffusion Model",
    description: "Models product adoption using Bass diffusion model",
    status: "active",
    lastRun: "5 hours ago",
    inputs: [
      { name: "marketSize", type: "number", value: 1000000, unit: "customers" },
      { name: "innovationCoefficient", type: "number", value: 0.03, unit: "" },
      { name: "imitationCoefficient", type: "number", value: 0.38, unit: "" },
      { name: "timeHorizon", type: "number", value: 10, unit: "years" },
    ],
    outputs: [
      { name: "adoptionCurve", type: "object", value: "[data points]", unit: "array" },
      { name: "peakAdoptionTime", type: "number", value: 3.75, unit: "years" },
      { name: "totalAdoption", type: "number", value: 850000, unit: "customers" },
    ],
  },
  {
    id: "market-4",
    name: "Conjoint Analysis",
    description: "Analyzes consumer preferences using conjoint analysis",
    status: "inactive",
    lastRun: "1 day ago",
    inputs: [
      {
        name: "attributes",
        type: "object",
        value: { price: [100, 200, 300], features: ["basic", "premium", "deluxe"], brand: ["A", "B", "C"] },
        unit: "",
      },
      { name: "surveyData", type: "object", value: { respondents: 200, preferences: [] }, unit: "" },
    ],
    outputs: [
      { name: "attributeImportance", type: "object", value: "[data points]", unit: "" },
      { name: "partWorth", type: "object", value: "[data points]", unit: "" },
      { name: "optimalConfiguration", type: "object", value: "[data points]", unit: "" },
    ],
  },
]

export default function MarketAnalysisPage() {
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
          <h1 className="text-2xl font-bold">Market Analysis</h1>
          <p className="text-muted-foreground">Manage market analysis modules and their configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis Group</CardTitle>
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
                    {marketModules.map((module) => (
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
                        <p className="text-sm">Upstream dependencies:</p>
                        <ul className="list-disc pl-5 mt-1 text-sm">
                          <li>Financial Models</li>
                        </ul>
                        <p className="text-sm mt-2">Downstream dependencies:</p>
                        <ul className="list-disc pl-5 mt-1 text-sm">
                          <li>Regulatory Compliance</li>
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
                          { date: "Today, 12:45", status: "success", duration: "3.5s" },
                          { date: "Today, 08:30", status: "success", duration: "3.4s" },
                          { date: "Yesterday, 15:20", status: "failed", duration: "4.2s" },
                          { date: "Yesterday, 09:15", status: "success", duration: "3.3s" },
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
                            <div className="text-2xl font-bold">3.5s</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Success Rate</div>
                            <div className="text-2xl font-bold">85%</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Total Runs</div>
                            <div className="text-2xl font-bold">65</div>
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
                    <span>{marketModules.length}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Active Modules</span>
                    <span>{marketModules.filter((m) => m.status === "active").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span>3 hours ago</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Module Health</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Active</span>
                        <span>
                          {marketModules.filter((m) => m.status === "active").length} / {marketModules.length}
                        </span>
                      </div>
                      <Progress
                        value={(marketModules.filter((m) => m.status === "active").length / marketModules.length) * 100}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Success Rate</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Key Outputs</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Price Elasticity:</span>
                      <span className="font-medium">-1.05</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Market Segment:</span>
                      <span className="font-medium">Premium</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Peak Adoption:</span>
                      <span className="font-medium">3.75 years</span>
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
