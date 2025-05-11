"use client"

import { useState } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, History, Plus, Clock, CheckCircle } from "lucide-react"

export function RunIteration() {
  const { toast } = useToast()
  const {
    getRunId,
    getLastCompletedRunId,
    getRunMetadata,
    getRunDuration,
    getRunStartTime,
    getRunEndTime,
    getIterationCount,
    incrementIterationCount,
    resetOutputs,
    runAllModels,
  } = useModelState()

  const [iterationName, setIterationName] = useState("")
  const [iterationReason, setIterationReason] = useState("")
  const [selectedParameters, setSelectedParameters] = useState([])
  const [executionMode, setExecutionMode] = useState("parallel")

  const runId = getRunId() || getLastCompletedRunId()
  const currentIteration = getIterationCount() + 1

  const handleCreateIteration = () => {
    // In a real app, this would call an API to create a new iteration
    incrementIterationCount()
    resetOutputs()

    toast({
      title: "New iteration created",
      description: `Iteration ${currentIteration + 1} has been created based on Run #${runId}.`,
    })

    // Clear form
    setIterationName("")
    setIterationReason("")
    setSelectedParameters([])
  }

  const handleRunIteration = () => {
    // Run the new iteration
    runAllModels(executionMode === "parallel")

    toast({
      title: "Iteration started",
      description: `Iteration ${currentIteration + 1} is now running.`,
    })
  }

  // Sample iteration history - in a real app, this would come from an API
  const iterationHistory = [
    {
      id: 1,
      name: "Initial Run",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: "completed",
      changes: "Initial model parameters",
    },
    {
      id: 2,
      name: "Parameter Adjustment",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: "completed",
      changes: "Adjusted risk tolerance parameters",
    },
    {
      id: 3,
      name: "Current Run",
      date: new Date().toLocaleDateString(),
      status: "active",
      changes: "Updated market conditions",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Run ID:</span>
              <Badge variant="outline" className="font-mono">
                {runId || "No completed run"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Iteration:</span>
              <Badge>{currentIteration}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <Badge className="bg-green-100 text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" /> Completed
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Duration:</span>
              <span>{getRunDuration()}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Completed At:</span>
              <span>{getRunEndTime() ? new Date(getRunEndTime()).toLocaleString() : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Iteration History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {iterationHistory.map((iteration) => (
                    <tr key={iteration.id} className="border-t">
                      <td className="p-2">{iteration.id}</td>
                      <td className="p-2">{iteration.name}</td>
                      <td className="p-2">{iteration.date}</td>
                      <td className="p-2">
                        <Badge
                          className={
                            iteration.status === "completed"
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-100 text-blue-600"
                          }
                        >
                          {iteration.status === "completed" ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" /> Completed
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" /> Active
                            </>
                          )}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Create New Iteration
          </CardTitle>
          <CardDescription>Create a new iteration based on the current run with modified parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iterationName">Iteration Name</Label>
              <Input
                id="iterationName"
                placeholder="Enter a name for this iteration..."
                value={iterationName}
                onChange={(e) => setIterationName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="executionMode">Execution Mode</Label>
              <Select value={executionMode} onValueChange={setExecutionMode}>
                <SelectTrigger id="executionMode">
                  <SelectValue placeholder="Select execution mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parallel">Parallel Execution</SelectItem>
                  <SelectItem value="sequential">Sequential Execution</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iterationReason">Reason for Iteration</Label>
            <Textarea
              id="iterationReason"
              placeholder="Describe why you're creating this iteration..."
              value={iterationReason}
              onChange={(e) => setIterationReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Parameter Changes</Label>
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Select parameters to modify for this iteration</p>
                <Button variant="outline" className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Parameter Change
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={handleCreateIteration} disabled={!runId || !iterationName}>
            <History className="mr-2 h-4 w-4" />
            Create Iteration
          </Button>
          <Button
            onClick={handleRunIteration}
            disabled={!runId || !iterationName}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Iteration
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parameter Comparison</CardTitle>
          <CardDescription>Compare parameters across iterations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Parameter</th>
                  <th className="text-left p-2">Iteration 1</th>
                  <th className="text-left p-2">Iteration 2</th>
                  <th className="text-left p-2">Current</th>
                  <th className="text-left p-2">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 font-medium">Risk Tolerance</td>
                  <td className="p-2">0.75</td>
                  <td className="p-2">0.85</td>
                  <td className="p-2">0.90</td>
                  <td className="p-2 text-green-600">+20%</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Market Volatility</td>
                  <td className="p-2">0.25</td>
                  <td className="p-2">0.35</td>
                  <td className="p-2">0.30</td>
                  <td className="p-2 text-amber-600">+5%</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Interest Rate</td>
                  <td className="p-2">3.5%</td>
                  <td className="p-2">3.5%</td>
                  <td className="p-2">4.0%</td>
                  <td className="p-2 text-blue-600">+0.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
