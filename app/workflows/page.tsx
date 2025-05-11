"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipForward, Settings, Zap } from "lucide-react"
import { WorkflowGraph } from "@/components/workflow-graph"
import { DependencyGraph } from "@/components/dependency-graph"
import { DependencyAnalyzer } from "@/components/dependency-analyzer"
import { ExecutionStatistics } from "@/components/execution-statistics"
import { ConditionalDependencyEditor } from "@/components/conditional-dependency-editor"
import { RunBoard } from "@/components/run-board"
import { useToast } from "@/components/ui/use-toast"
import { useModelState } from "@/context/model-state-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RunSignoff } from "@/components/run-signoff"
import { RunIteration } from "@/components/run-iteration"
import { RunExport } from "@/components/run-export"

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState("flowchart")
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [useParallelExecution, setUseParallelExecution] = useState(false)
  const { toast } = useToast()
  const {
    modelGroups,
    updateModelGroup,
    resetOutputs,
    runModel,
    getExecutionSequence,
    runAllModels,
    pauseExecution,
    resumeExecution,
    isSimulationRunning,
    isSimulationPaused,
    getPausedOnModel,
    continueAfterBreakpoint,
    getRunId,
    getRunStartTime,
    getRunDuration,
    getRunEndTime,
    getRunMetadata,
    getRunHistory,
    getLastCompletedRunId,
    getIterationCount,
  } = useModelState()

  const handleRunAll = () => {
    // Run all models with parallel execution setting
    runAllModels(useParallelExecution)

    toast({
      title: "Workflow execution started",
      description: `Running all models in ${useParallelExecution ? "parallel" : "sequential"} mode.`,
    })
  }

  const handleRunSelected = (modelId) => {
    // Run the selected model
    runModel(modelId)
  }

  const handleToggleBreakpoint = (modelId) => {
    const model = modelGroups.find((m) => m.id === modelId)
    if (model) {
      const newBreakpoint = !model.breakpoint

      updateModelGroup(modelId, { breakpoint: newBreakpoint })

      toast({
        title: `Breakpoint ${newBreakpoint ? "set" : "removed"}`,
        description: `Execution will ${newBreakpoint ? "pause" : "not pause"} after ${model.name} completes.`,
      })
    }
  }

  const handleToggleEnabled = (modelId) => {
    const model = modelGroups.find((m) => m.id === modelId)
    if (model) {
      const newEnabled = !model.enabled

      updateModelGroup(modelId, {
        enabled: newEnabled,
        status: newEnabled ? "idle" : "disabled",
      })

      toast({
        title: `${model.name} ${newEnabled ? "enabled" : "disabled"}`,
        description: `The model has been ${newEnabled ? "added to" : "removed from"} the workflow sequence.`,
      })
    }
  }

  const handleContinueAfterBreakpoint = () => {
    const pausedModelId = getPausedOnModel()
    if (pausedModelId) {
      continueAfterBreakpoint(pausedModelId)

      const model = modelGroups.find((m) => m.id === pausedModelId)
      toast({
        title: "Continuing execution",
        description: `Continuing execution after breakpoint on ${model?.name || pausedModelId}.`,
      })
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow Orchestration</h1>
          <p className="text-muted-foreground">Configure and execute model workflows</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center space-x-2 mr-4">
            <Switch id="parallel-execution" checked={useParallelExecution} onCheckedChange={setUseParallelExecution} />
            <Label htmlFor="parallel-execution" className={useParallelExecution ? "font-bold text-blue-600" : ""}>
              {useParallelExecution ? "Parallel Execution" : "Sequential Execution"}
            </Label>
          </div>

          {useParallelExecution && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              <Zap className="w-3 h-3 mr-1" /> Parallel Mode
            </Badge>
          )}

          {/* Run information badge */}
          {(isSimulationRunning() || getLastCompletedRunId()) && (
            <Badge variant={isSimulationPaused() ? "outline" : "secondary"} className="mr-2">
              {getRunId()
                ? `Run #${getRunId().substring(getRunId().length - 4)}`
                : getLastCompletedRunId()
                  ? `Last: #${getLastCompletedRunId().substring(getLastCompletedRunId().length - 4)}`
                  : "New Run"}
              {getIterationCount() > 0 && ` (Iteration ${getIterationCount() + 1})`}
            </Badge>
          )}

          {!isSimulationRunning() ? (
            <Button onClick={handleRunAll}>
              <Play className="mr-2 h-4 w-4" />
              Run All
            </Button>
          ) : isSimulationPaused() ? (
            <>
              <Button onClick={resumeExecution}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              {getPausedOnModel() && (
                <Button onClick={handleContinueAfterBreakpoint}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Continue Past Breakpoint
                </Button>
              )}
            </>
          ) : (
            <Button onClick={pauseExecution}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}

          <Button variant="ghost">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="flowchart">Workflow Graph</TabsTrigger>
          <TabsTrigger value="runboard">Run Dashboard</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="analyzer">Dependency Analyzer</TabsTrigger>
          <TabsTrigger value="statistics">Execution Statistics</TabsTrigger>
          <TabsTrigger value="signoff">Sign-off</TabsTrigger>
          <TabsTrigger value="iteration">Iteration</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="flowchart" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <WorkflowGraph
                modelGroups={modelGroups}
                onRunAll={handleRunAll}
                onRunSelected={handleRunSelected}
                onToggleBreakpoint={handleToggleBreakpoint}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runboard" className="mt-0">
          <RunBoard
            modelGroups={modelGroups}
            onRunAll={handleRunAll}
            onRunSelected={handleRunSelected}
            onResetOutputs={resetOutputs}
          />
        </TabsContent>

        <TabsContent value="dependencies" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dependency Configuration</CardTitle>
                <CardDescription>Configure conditional dependencies between models</CardDescription>
              </CardHeader>
              <CardContent>
                <ConditionalDependencyEditor
                  modelGroups={modelGroups}
                  selectedModelId={selectedModelId}
                  onSelectModel={setSelectedModelId}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dependency Graph</CardTitle>
                <CardDescription>Visual representation of model dependencies</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[600px]">
                <DependencyGraph
                  modelGroups={modelGroups}
                  onNodeClick={(modelId) => setSelectedModelId(modelId)}
                  onToggleEnabled={handleToggleEnabled}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analyzer" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Dependency Analyzer</CardTitle>
              <CardDescription>Automatically detect and configure dependencies between models</CardDescription>
            </CardHeader>
            <CardContent>
              <DependencyAnalyzer modelGroups={modelGroups} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Execution Statistics</CardTitle>
              <CardDescription>Performance metrics for workflow execution</CardDescription>
            </CardHeader>
            <CardContent>
              <ExecutionStatistics modelGroups={modelGroups} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signoff" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Run Sign-off</CardTitle>
              <CardDescription>Review and approve completed model runs</CardDescription>
            </CardHeader>
            <CardContent>
              <RunSignoff />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iteration" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Run Iteration</CardTitle>
              <CardDescription>Create and manage iterations of model runs</CardDescription>
            </CardHeader>
            <CardContent>
              <RunIteration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Run Export</CardTitle>
              <CardDescription>Export run results and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <RunExport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
