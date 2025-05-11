"use client"

import { useState } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import {
  Download,
  FileText,
  Table,
  FileJson,
  FileIcon as FilePdf,
  FileSpreadsheet,
  CheckCircle,
  History,
} from "lucide-react"

export function RunExport() {
  const { toast } = useToast()
  const {
    getRunId,
    getLastCompletedRunId,
    getRunMetadata,
    getRunDuration,
    getRunStartTime,
    getRunEndTime,
    getIterationCount,
    getExecutionSequence,
  } = useModelState()

  const [exportFormat, setExportFormat] = useState("pdf")
  const [exportOptions, setExportOptions] = useState({
    includeInputs: true,
    includeOutputs: true,
    includeCharts: true,
    includeMetadata: true,
    includeDependencies: false,
    includeExecutionDetails: false,
  })
  const [selectedIteration, setSelectedIteration] = useState("current")

  const runId = getRunId() || getLastCompletedRunId()
  const currentIteration = getIterationCount() + 1

  const handleOptionChange = (key) => {
    setExportOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleExport = () => {
    // In a real app, this would call an API to generate the export
    toast({
      title: "Export initiated",
      description: `Exporting Run #${runId} (Iteration ${selectedIteration === "current" ? currentIteration : selectedIteration}) as ${exportFormat.toUpperCase()}.`,
    })
  }

  // Sample export history - in a real app, this would come from an API
  const exportHistory = [
    {
      id: 1,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      format: "PDF",
      iteration: 1,
      user: "John Doe",
    },
    {
      id: 2,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      format: "Excel",
      iteration: 2,
      user: "Jane Smith",
    },
    {
      id: 3,
      date: new Date().toLocaleDateString(),
      format: "JSON",
      iteration: 3,
      user: "Current User",
    },
  ]

  const getFormatIcon = (format) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return <FilePdf className="w-4 h-4" />
      case "excel":
        return <FileSpreadsheet className="w-4 h-4" />
      case "json":
        return <FileJson className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Run Information</CardTitle>
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
            <CardTitle className="text-lg">Export History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Format</th>
                    <th className="text-left p-2">Iteration</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map((export_) => (
                    <tr key={export_.id} className="border-t">
                      <td className="p-2">{export_.date}</td>
                      <td className="p-2 flex items-center">
                        {getFormatIcon(export_.format)}
                        <span className="ml-1">{export_.format}</span>
                      </td>
                      <td className="p-2">{export_.iteration}</td>
                      <td className="p-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
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
            <Download className="mr-2 h-5 w-5" />
            Export Run Results
          </CardTitle>
          <CardDescription>Configure and download run results in various formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Select Iteration</h3>
              <RadioGroup value={selectedIteration} onValueChange={setSelectedIteration} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="current" />
                  <Label htmlFor="current">Current ({currentIteration})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="iteration1" />
                  <Label htmlFor="iteration1">Iteration 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="iteration2" />
                  <Label htmlFor="iteration2">Iteration 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All Iterations</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Export Format</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant={exportFormat === "pdf" ? "default" : "outline"}
                  className={`flex flex-col items-center justify-center h-24 ${exportFormat === "pdf" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  onClick={() => setExportFormat("pdf")}
                >
                  <FilePdf className="h-8 w-8 mb-2" />
                  <span>PDF Report</span>
                </Button>

                <Button
                  variant={exportFormat === "excel" ? "default" : "outline"}
                  className={`flex flex-col items-center justify-center h-24 ${exportFormat === "excel" ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={() => setExportFormat("excel")}
                >
                  <FileSpreadsheet className="h-8 w-8 mb-2" />
                  <span>Excel</span>
                </Button>

                <Button
                  variant={exportFormat === "json" ? "default" : "outline"}
                  className={`flex flex-col items-center justify-center h-24 ${exportFormat === "json" ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                  onClick={() => setExportFormat("json")}
                >
                  <FileJson className="h-8 w-8 mb-2" />
                  <span>JSON</span>
                </Button>

                <Button
                  variant={exportFormat === "csv" ? "default" : "outline"}
                  className={`flex flex-col items-center justify-center h-24 ${exportFormat === "csv" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  onClick={() => setExportFormat("csv")}
                >
                  <Table className="h-8 w-8 mb-2" />
                  <span>CSV</span>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Export Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeInputs"
                    checked={exportOptions.includeInputs}
                    onCheckedChange={() => handleOptionChange("includeInputs")}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="includeInputs" className="font-medium">
                      Include Inputs
                    </Label>
                    <p className="text-sm text-muted-foreground">Export all input parameters and values</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeOutputs"
                    checked={exportOptions.includeOutputs}
                    onCheckedChange={() => handleOptionChange("includeOutputs")}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="includeOutputs" className="font-medium">
                      Include Outputs
                    </Label>
                    <p className="text-sm text-muted-foreground">Export all model outputs and results</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={() => handleOptionChange("includeCharts")}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="includeCharts" className="font-medium">
                      Include Charts
                    </Label>
                    <p className="text-sm text-muted-foreground">Include visualizations and charts (PDF only)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={() => handleOptionChange("includeMetadata")}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="includeMetadata" className="font-medium">
                      Include Metadata
                    </Label>
                    <p className="text-sm text-muted-foreground">Include run metadata and execution details</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeDependencies"
                    checked={exportOptions.includeDependencies}
                    onCheckedChange={() => handleOptionChange("includeDependencies")}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="includeDependencies" className="font-medium">
                      Include Dependencies
                    </Label>
                    <p className="text-sm text-muted-foreground">Include model dependency information</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeExecutionDetails"
                    checked={exportOptions.includeExecutionDetails}
                    onCheckedChange={() => handleOptionChange("includeExecutionDetails")}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="includeExecutionDetails" className="font-medium">
                      Include Execution Details
                    </Label>
                    <p className="text-sm text-muted-foreground">Include detailed execution logs and timing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <History className="mr-1 h-4 w-4" />
            <span>{exportHistory.length} previous exports</span>
          </div>
          <Button onClick={handleExport} disabled={!runId} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
