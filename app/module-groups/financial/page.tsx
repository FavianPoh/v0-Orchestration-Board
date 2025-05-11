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

// Sample data for Financial Models group
const financialModules = [
  {
    id: "fin-1",
    name: "Interest Rate",
    description: "Projects interest rates based on economic conditions",
    status: "active",
    lastRun: "1 hour ago",
    inputs: [
      { name: "currentRate", type: "number", value: 4.5, unit: "%" },
      { name: "inflation", type: "number", value: 3.2, unit: "%" },
      { name: "gdpGrowth", type: "number", value: 2.5, unit: "%" },
    ],
    outputs: [{ name: "projectedRate", type: "number", value: 3.95, unit: "%" }],
  },
  {
    id: "fin-2",
    name: "Stock Market",
    description: "Projects stock market performance",
    status: "active",
    lastRun: "1 hour ago",
    inputs: [
      { name: "currentIndex", type: "number", value: 4200, unit: "points" },
      { name: "interestRate", type: "number", value: 4.5, unit: "%" },
      { name: "corporateEarnings", type: "number", value: 2200, unit: "billion USD" },
    ],
    outputs: [{ name: "projectedIndex", type: "number", value: 4350, unit: "points" }],
  },
  {
    id: "fin-3",
    name: "Currency Exchange",
    description: "Projects currency exchange rates",
    status: "active",
    lastRun: "2 hours ago",
    inputs: [
      { name: "currentRate", type: "number", value: 1.1, unit: "EUR/USD" },
      { name: "domesticInterestRate", type: "number", value: 4.5, unit: "%" },
      { name: "foreignInterestRate", type: "number", value: 3.5, unit: "%" },
    ],
    outputs: [{ name: "projectedRate", type: "number", value: 1.09, unit: "EUR/USD" }],
  },
  {
    id: "fin-4",
    name: "Black-Scholes Option Pricer",
    description: "Calculates option prices using the Black-Scholes model",
    status: "inactive",
    lastRun: "1 day ago",
    inputs: [
      { name: "stockPrice", type: "number", value: 100, unit: "USD" },
      { name: "strikePrice", type: "number", value: 105, unit: "USD" },
      { name: "timeToMaturity", type: "number", value: 1, unit: "years" },
      { name: "riskFreeRate", type: "number", value: 0.05, unit: "" },
      { name: "volatility", type: "number", value: 0.2, unit: "" },
    ],
    outputs: [
      { name: "callPrice", type: "number", value: 8.02, unit: "USD" },
      { name: "putPrice", type: "number", value: 7.47, unit: "USD" },
    ],
  },
  {
    id: "fin-5",
    name: "Yield Curve Generator",
    description: "Generates a yield curve based on short and long-term rates",
    status: "active",
    lastRun: "3 hours ago",
    inputs: [
      { name: "shortTermRate", type: "number", value: 3.5, unit: "%" },
      { name: "longTermRate", type: "number", value: 4.2, unit: "%" },
      { name: "curvature", type: "number", value: 0.3, unit: "" },
    ],
    outputs: [
      { name: "yieldCurve", type: "object", value: "[data points]", unit: "array" },
      { name: "inverted", type: "boolean", value: false, unit: "" },
    ],
  },
]

export default function FinancialModelsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("modules")
  const [groupEnabled, setGroupEnabled] = useState(true)
  const [groupFrozen, setGroupFrozen] = useState(true)

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
          <h1 className="text-2xl font-bold">Financial Models</h1>
          <p className="text-muted-foreground">Manage financial modeling modules and their configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Financial Models Group</CardTitle>
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
                    {financialModules.map((module) => (
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
                          <li>Economic Models</li>
                        </ul>
                        <p className="text-sm mt-2">Downstream dependencies:</p>
                        <ul className="list-disc pl-5 mt-1 text-sm">
                          <li>Risk Assessment</li>
                          <li>Market Analysis</li>
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
                          { date: "Today, 13:45", status: "success", duration: "2.8s" },
                          { date: "Today, 10:30", status: "success", duration: "2.7s" },
                          { date: "Yesterday, 16:15", status: "success", duration: "2.9s" },
                          { date: "Yesterday, 09:20", status: "failed", duration: "3.5s" },
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
                            <div className="text-2xl font-bold">2.8s</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Success Rate</div>
                            <div className="text-2xl font-bold">95%</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Total Runs</div>
                            <div className="text-2xl font-bold">98</div>
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
                    <span>{financialModules.length}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Active Modules</span>
                    <span>{financialModules.filter((m) => m.status === "active").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span>1 hour ago</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Module Health</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Active</span>
                        <span>
                          {financialModules.filter((m) => m.status === "active").length} / {financialModules.length}
                        </span>
                      </div>
                      <Progress
                        value={
                          (financialModules.filter((m) => m.status === "active").length / financialModules.length) * 100
                        }
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Success Rate</span>
                        <span>95%</span>
                      </div>
                      <Progress value={95} />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Key Outputs</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Interest Rate:</span>
                      <span className="font-medium">4.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Market Index:</span>
                      <span className="font-medium">4,350</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>EUR/USD:</span>
                      <span className="font-medium">1.09</span>
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
