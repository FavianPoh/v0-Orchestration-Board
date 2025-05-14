"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useModelState } from "@/context/model-state-context"
import { BarChart } from "@/components/ui/chart"
import {
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Sliders,
  BarChart2,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"

export function BreakpointSensitivityAnalysis({ modelId, onContinue, onClose }) {
  const { toast } = useToast()
  const { modelGroups, getModelById, getModelDependents, toggleModelFrozen, isModelFrozen, continueAfterBreakpoint } =
    useModelState()

  const [activeTab, setActiveTab] = useState("parameters")
  const [parameters, setParameters] = useState<any[]>([])
  const [outputMetrics, setOutputMetrics] = useState<any[]>([])
  const [impactedModels, setImpactedModels] = useState<string[]>([])
  const [runningAnalysis, setRunningAnalysis] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any | null>(null)
  const [thresholds, setThresholds] = useState({
    absoluteThreshold: 1,
    percentageThreshold: 5,
    useAbsolute: false,
  })

  // Get the current model
  const model = getModelById(modelId)

  // Initialize parameters and outputs from the current model
  useEffect(() => {
    if (model) {
      // Extract parameters
      const modelParams = model.parameters || []
      setParameters(modelParams)

      // Extract outputs
      const modelOutputs = model.outputs || []
      setOutputMetrics(modelOutputs)

      // Get dependent models
      const dependents = getModelDependents(modelId)
      setImpactedModels(dependents)
    }
  }, [model, modelId, getModelDependents])

  // Handle parameter value change
  const handleParameterChange = (id: string, value: number) => {
    console.log("BreakpointSensitivityAnalysis - handleParameterChange called for parameter:", id, "with value:", value)

    setParameters((prevParams) =>
      prevParams.map((param) =>
        param.id === id
          ? {
              ...param,
              value,
              changed: true,
              lastManualValue: value, // Track user-set values
            }
          : param,
      ),
    )
  }

  // Run sensitivity analysis
  const runSensitivityAnalysis = () => {
    console.log(
      "BREAKPOINT ANALYSIS - Current parameters:",
      parameters.map((p) => ({ id: p.id, value: p.value, originalValue: p.originalValue, changed: p.changed })),
    )
    console.log("BreakpointSensitivityAnalysis - runSensitivityAnalysis called with parameters:", parameters)

    setRunningAnalysis(true)

    // Simulate analysis running
    setTimeout(() => {
      // Generate mock results
      const results = {
        originalValues: {},
        newValues: {},
        changes: {},
        impactedModels: impactedModels,
        approximatedModels: [],
        rerunModels: [],
        thresholdExceeded: false,
        freezeRecommendations: [],
      }

      // For each output metric, generate a simulated change
      outputMetrics.forEach((metric) => {
        const originalValue = Number.parseFloat(metric.value)
        if (isNaN(originalValue)) return

        // Generate a change based on parameter changes
        const changeFactor = Math.random() * 0.2 * (Math.random() > 0.5 ? 1 : -1)
        const newValue = originalValue * (1 + changeFactor)
        const absoluteChange = newValue - originalValue
        const percentageChange = (absoluteChange / originalValue) * 100

        // Check if threshold is exceeded
        let thresholdExceeded = false
        if (thresholds.useAbsolute) {
          thresholdExceeded = Math.abs(absoluteChange) > thresholds.absoluteThreshold
        } else {
          thresholdExceeded = Math.abs(percentageChange) > thresholds.percentageThreshold
        }

        // Store results
        results.originalValues[metric.id] = originalValue
        results.newValues[metric.id] = newValue
        results.changes[metric.id] = {
          absolute: absoluteChange,
          percentage: percentageChange,
          thresholdExceeded,
        }

        // Update overall threshold exceeded flag
        if (thresholdExceeded) {
          results.thresholdExceeded = true
        }
      })

      // Generate freeze recommendations
      impactedModels.forEach((modelId) => {
        const model = getModelById(modelId)
        if (model) {
          // Randomly decide if this model should be frozen or rerun
          const shouldFreeze = Math.random() > 0.5

          if (shouldFreeze) {
            results.freezeRecommendations.push({
              modelId,
              modelName: model.name,
              reason: "Changes below threshold",
            })
            results.approximatedModels.push(modelId)
          } else {
            results.rerunModels.push(modelId)
          }
        }
      })

      // Store current parameter values with the results to prevent them from being lost
      setAnalysisResults({
        ...results,
        // Store the current parameter state to prevent loss after analysis
        parameterState: parameters.map((p) => ({ ...p })),
      })
      setRunningAnalysis(false)

      toast({
        title: "Sensitivity Analysis Complete",
        description: results.thresholdExceeded
          ? "Thresholds exceeded. Some models require full recalculation."
          : "Analysis complete. All changes within thresholds.",
      })
    }, 2000)
  }

  // Apply sensitivity changes and continue
  const applySensitivityChanges = () => {
    if (!analysisResults) return

    // In a real implementation, we would:
    // 1. Update model parameters with the new values
    // 2. Mark models for approximation or full rerun
    // 3. Freeze models that don't need to be rerun

    // Freeze recommended models
    analysisResults.freezeRecommendations.forEach((rec) => {
      if (!isModelFrozen(rec.modelId)) {
        toggleModelFrozen(rec.modelId)
      }
    })

    toast({
      title: "Applying Sensitivity Changes",
      description: `Froze ${analysisResults.freezeRecommendations.length} models and marked ${analysisResults.rerunModels.length} for recalculation.`,
    })

    // Continue execution after breakpoint
    setTimeout(() => {
      if (onContinue) {
        onContinue()
      } else {
        continueAfterBreakpoint(modelId)
      }
    }, 500)
  }

  // Generate chart data for sensitivity impact visualization
  const generateImpactChartData = () => {
    if (!analysisResults) return []

    return Object.keys(analysisResults.changes)
      .map((metricId) => {
        const metric = outputMetrics.find((m) => m.id === metricId) || { name: metricId }
        return {
          metric: metric.name,
          change: analysisResults.changes[metricId].percentage,
        }
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }

  // Add this after the other useEffect hooks
  useEffect(() => {
    // When analysis results are set, ensure parameters maintain their values
    if (analysisResults?.parameterState) {
      setParameters((prev) => {
        // Create a new array with preserved user values
        return prev.map((param, i) => {
          const storedParam = analysisResults.parameterState[i]
          if (!storedParam) return param

          // If the user manually changed this parameter after the analysis was run,
          // preserve that value instead of restoring from analysis results
          if (param.lastManualValue !== undefined) {
            return {
              ...storedParam,
              value: param.lastManualValue,
              changed: true,
            }
          }

          // Otherwise use the stored value from analysis
          return storedParam
        })
      })
    }
  }, [analysisResults])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Pause className="mr-2 h-5 w-5 text-amber-500" />
            Breakpoint Sensitivity Analysis
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700">
            Model: {model?.name || modelId}
          </Badge>
        </CardTitle>
        <CardDescription>Analyze how changes to model outputs will affect downstream models</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="parameters">
              <Sliders className="h-4 w-4 mr-2" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="thresholds">
              <AlertCircle className="h-4 w-4 mr-2" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResults}>
              <BarChart2 className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="p-4 border-t">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Model Parameters</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setParameters((prev) => prev.map((p) => ({ ...p, changed: false })))}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {parameters.length > 0 ? (
                    parameters.map((param) => (
                      <div
                        key={param.id}
                        className={`border rounded-md p-4 space-y-3 ${param.changed ? "border-blue-300 bg-blue-50/30" : ""}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{param.name}</h4>
                              {param.changed && <Badge className="bg-blue-100 text-blue-600">Modified</Badge>}
                            </div>
                            {param.min !== undefined && param.max !== undefined && (
                              <p className="text-sm text-muted-foreground">
                                Range: {param.min} to {param.max} {param.unit}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-[1fr_80px] gap-4 items-center">
                          {param.min !== undefined && param.max !== undefined ? (
                            <Slider
                              value={[param.value]}
                              min={param.min}
                              max={param.max}
                              step={param.step || 0.1}
                              onValueChange={(value) => handleParameterChange(param.id, value[0])}
                            />
                          ) : (
                            <div className="h-4"></div>
                          )}
                          <div className="flex items-center">
                            <Input
                              type="number"
                              value={param.value}
                              onChange={(e) => handleParameterChange(param.id, Number.parseFloat(e.target.value))}
                              min={param.min}
                              max={param.max}
                              step={param.step || 0.1}
                              className="h-8"
                            />
                            <span className="ml-1">{param.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No parameters available for this model</div>
                  )}
                </div>
              </ScrollArea>

              {/* Model Outputs */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Current Model Outputs</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium">Output</th>
                        <th className="text-left p-2 text-xs font-medium">Value</th>
                        <th className="text-left p-2 text-xs font-medium">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outputMetrics.length > 0 ? (
                        outputMetrics.map((output, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 text-sm">{output.name}</td>
                            <td className="p-2 text-sm font-mono">{output.value}</td>
                            <td className="p-2 text-sm text-muted-foreground">{output.unit || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground">
                            No outputs available for this model
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {impactedModels.length > 0 && (
                <div className="mt-4 border rounded-md p-4 bg-amber-50 border-amber-200">
                  <h4 className="font-medium flex items-center text-amber-800">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                    Potentially Impacted Downstream Models
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {impactedModels.map((modelId) => {
                      const model = getModelById(modelId)
                      return (
                        <Badge key={modelId} variant="outline" className="bg-amber-100 border-amber-200 text-amber-700">
                          {model?.name || modelId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setActiveTab("thresholds")}>
                  Configure Thresholds
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={runSensitivityAnalysis} disabled={runningAnalysis}>
                  {runningAnalysis ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Sensitivity Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Thresholds Tab */}
          <TabsContent value="thresholds" className="p-4 border-t">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Sensitivity Thresholds</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Threshold Type</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose whether to use absolute or percentage thresholds
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={thresholds.useAbsolute ? "default" : "outline"}
                        size="sm"
                        onClick={() => setThresholds((prev) => ({ ...prev, useAbsolute: true }))}
                      >
                        Absolute
                      </Button>
                      <Button
                        variant={!thresholds.useAbsolute ? "default" : "outline"}
                        size="sm"
                        onClick={() => setThresholds((prev) => ({ ...prev, useAbsolute: false }))}
                      >
                        Percentage
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="absolute-threshold" className="text-sm">
                        Absolute Threshold
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="absolute-threshold"
                          type="number"
                          value={thresholds.absoluteThreshold}
                          onChange={(e) =>
                            setThresholds((prev) => ({
                              ...prev,
                              absoluteThreshold: Number.parseFloat(e.target.value),
                            }))
                          }
                          step={0.1}
                          min={0}
                          className={thresholds.useAbsolute ? "border-blue-300" : ""}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Rerun models if absolute change exceeds this value
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="percentage-threshold" className="text-sm">
                        Percentage Threshold (%)
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="percentage-threshold"
                          type="number"
                          value={thresholds.percentageThreshold}
                          onChange={(e) =>
                            setThresholds((prev) => ({
                              ...prev,
                              percentageThreshold: Number.parseFloat(e.target.value),
                            }))
                          }
                          step={1}
                          min={0}
                          className={!thresholds.useAbsolute ? "border-blue-300" : ""}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Rerun models if percentage change exceeds this value
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Freezing Strategy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-Freeze Models</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically freeze models with changes below threshold
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Use Linear Approximation</h4>
                      <p className="text-sm text-muted-foreground">Apply linear approximation for small changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setActiveTab("parameters")}>
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Back to Parameters
                </Button>
                <Button onClick={runSensitivityAnalysis} disabled={runningAnalysis}>
                  {runningAnalysis ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Sensitivity Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="p-4 border-t">
            {analysisResults ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Sensitivity Analysis Results</h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("parameters")}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Analysis
                  </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className={analysisResults.thresholdExceeded ? "border-red-300" : "border-green-300"}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Threshold Status</h4>
                        {analysisResults.thresholdExceeded ? (
                          <Badge className="bg-red-100 text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Thresholds Exceeded
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Within Thresholds
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {analysisResults.thresholdExceeded
                          ? "Some changes exceed defined thresholds and require full recalculation"
                          : "All changes are within defined thresholds"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Models to Rerun</h4>
                        <Badge variant="outline">{analysisResults.rerunModels.length}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {analysisResults.rerunModels.map((modelId) => {
                          const model = getModelById(modelId)
                          return (
                            <Badge key={modelId} variant="outline" className="bg-blue-50">
                              {model?.name || modelId}
                            </Badge>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Models to Freeze</h4>
                        <Badge variant="outline">{analysisResults.freezeRecommendations.length}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {analysisResults.freezeRecommendations.map((rec) => (
                          <Badge key={rec.modelId} variant="outline" className="bg-green-50">
                            {rec.modelName}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Impact Visualization */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Impact on Outputs</CardTitle>
                    <CardDescription>Percentage change in output metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    <BarChart
                      data={generateImpactChartData()}
                      index="metric"
                      categories={["change"]}
                      colors={["blue"]}
                      valueFormatter={(value) => `${value.toFixed(2)}%`}
                    />
                  </CardContent>
                </Card>

                {/* Detailed Changes Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Detailed Changes</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 text-xs font-medium">Metric</th>
                            <th className="text-left p-2 text-xs font-medium">Original Value</th>
                            <th className="text-left p-2 text-xs font-medium">New Value</th>
                            <th className="text-left p-2 text-xs font-medium">Change</th>
                            <th className="text-left p-2 text-xs font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outputMetrics.map((metric) => {
                            const change = analysisResults.changes[metric.id]
                            if (!change) return null

                            return (
                              <tr key={metric.id} className="border-t">
                                <td className="p-2 text-sm font-medium">{metric.name}</td>
                                <td className="p-2 text-sm">
                                  {analysisResults.originalValues[metric.id]?.toFixed(2)} {metric.unit}
                                </td>
                                <td className="p-2 text-sm">
                                  {analysisResults.newValues[metric.id]?.toFixed(2)} {metric.unit}
                                </td>
                                <td className="p-2 text-sm">
                                  <span className={change.absolute >= 0 ? "text-green-600" : "text-red-600"}>
                                    {change.absolute >= 0 ? "+" : ""}
                                    {change.absolute.toFixed(2)} {metric.unit}({change.percentage >= 0 ? "+" : ""}
                                    {change.percentage.toFixed(2)}%)
                                  </span>
                                </td>
                                <td className="p-2 text-sm">
                                  {change.thresholdExceeded ? (
                                    <Badge className="bg-red-100 text-red-600">Threshold Exceeded</Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-600">Within Threshold</Badge>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Analysis Results</h3>
                <p className="text-muted-foreground mb-4">Run a sensitivity analysis to see results here</p>
                <Button onClick={() => setActiveTab("parameters")}>
                  <Sliders className="mr-2 h-4 w-4" />
                  Go to Parameters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => continueAfterBreakpoint(modelId)}>
            <Play className="mr-2 h-4 w-4" />
            Continue Without Changes
          </Button>
          <Button
            onClick={applySensitivityChanges}
            disabled={!analysisResults}
            className={!analysisResults ? "opacity-50" : ""}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Apply Changes & Continue
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
