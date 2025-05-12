"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  CheckCircle,
  FileCheck,
  ThermometerSun,
  RotateCw,
  FileSignature,
  Save,
  Download,
  Share2,
  Lock,
  AlertTriangle,
  Play,
  RefreshCw,
  FileCog,
  Clock,
  Pause,
} from "lucide-react"

export function RunCompletionOptions() {
  const {
    getRunState,
    transitionToAdjustmentsPhase,
    finalizeRun,
    getRunId,
    getRunDuration,
    getIterationCount,
    incrementIterationCount,
    runAllModels,
    resetOutputs,
    getRunMetadata,
    getRunStartTime,
    getRunEndTime,
    getPausedOnModel,
    continueAfterBreakpoint,
    isSimulationPaused,
    getModelById,
  } = useModelState()

  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("signoff")
  const [signoffComment, setSignoffComment] = useState("")
  const [signoffName, setSignoffName] = useState("")
  const [signoffDialogOpen, setSignoffDialogOpen] = useState(false)
  const [iterationName, setIterationName] = useState("")
  const [iterationDialogOpen, setIterationDialogOpen] = useState(false)

  const runState = getRunState()
  const runId = getRunId()
  const runDuration = getRunDuration()
  const iterationCount = getIterationCount()
  const runMetadata = getRunMetadata()
  const paused = isSimulationPaused()
  const pausedModelId = getPausedOnModel()
  const pausedModel = pausedModelId ? getModelById(pausedModelId) : null

  // Handle transition to adjustments phase
  const handleTransitionToAdjustments = () => {
    transitionToAdjustmentsPhase()
    toast({
      title: "Entered Adjustments Phase",
      description: "You can now make adjustments to models while preserving completed results.",
    })
  }

  // Handle finalize run
  const handleFinalizeRun = () => {
    finalizeRun()
    toast({
      title: "Run Finalized",
      description: "The run has been finalized and results are now locked.",
    })
  }

  // Handle sign off run
  const handleSignOffRun = () => {
    finalizeRun()
    toast({
      title: "Run Signed Off",
      description: `Run #${runId?.substring(runId.length - 8)} has been signed off by ${signoffName}.`,
    })
    setSignoffDialogOpen(false)
  }

  // Handle start new iteration
  const handleStartNewIteration = () => {
    // Increment iteration count
    incrementIterationCount()

    // Reset outputs but preserve some state
    resetOutputs()

    // Start new run
    runAllModels(true)

    toast({
      title: "New Iteration Started",
      description: `Iteration ${iterationCount + 1}: ${iterationName}`,
    })

    setIterationDialogOpen(false)
  }

  const handleContinueAfterBreakpoint = () => {
    if (pausedModelId) {
      continueAfterBreakpoint(pausedModelId)
      toast({
        title: "Resuming Run",
        description: `Continuing execution past breakpoint at ${pausedModel?.name || pausedModelId}`,
      })
    }
  }

  // Get the appropriate state badge
  const getStateBadge = () => {
    switch (runState) {
      case "MAIN_COMPLETE":
        return (
          <Badge className="bg-green-100 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Main Complete
          </Badge>
        )
      case "ADJUSTMENTS":
        return (
          <Badge className="bg-amber-100 text-amber-600">
            <ThermometerSun className="w-3 h-3 mr-1" /> Adjustments
          </Badge>
        )
      case "FINALIZED":
        return (
          <Badge className="bg-green-100 text-green-600">
            <FileCheck className="w-3 h-3 mr-1" /> Finalized
          </Badge>
        )
      default:
        return <Badge variant="outline">{runState}</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Run Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5" /> Current Run Status
          </CardTitle>
          <CardDescription>Manage the current run and its lifecycle state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Run Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Run ID</div>
              <div className="font-mono">{runId ? `#${runId.substring(0, 8)}` : "No Active Run"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Run State</div>
              <div className="capitalize">
                {runState === "IDLE" && <Badge variant="outline">Idle</Badge>}
                {runState === "INITIATED" && <Badge className="bg-blue-100 text-blue-700">Initiated</Badge>}
                {runState === "RUNNING" && <Badge className="bg-blue-100 text-blue-700">Running</Badge>}
                {runState === "MAIN_COMPLETE" && <Badge className="bg-green-100 text-green-700">Completed</Badge>}
                {runState === "ADJUSTMENTS" && <Badge className="bg-amber-100 text-amber-700">Adjustments</Badge>}
                {runState === "FINALIZED" && <Badge className="bg-purple-100 text-purple-700">Finalized</Badge>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Duration</div>
              <div>{getRunDuration()} seconds</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Start Time</div>
              <div>{getRunStartTime() ? new Date(getRunStartTime()).toLocaleTimeString() : "—"}</div>
            </div>
          </div>

          {/* Paused Run - Breakpoint Banner */}
          {paused && pausedModelId && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-300 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-amber-100 p-2 rounded-full mr-3">
                    <Pause className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-800">Breakpoint Active</div>
                    <div className="text-sm text-amber-700">Run paused at: {pausedModel?.name || pausedModelId}</div>
                  </div>
                </div>
                <Button onClick={handleContinueAfterBreakpoint} className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Play className="mr-2 h-4 w-4" /> Resume Run #{runId?.substring(0, 4)}
                </Button>
              </div>
            </div>
          )}

          {/* Lifecycle Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {runState === "MAIN_COMPLETE" && (
              <Button
                onClick={() => {
                  transitionToAdjustmentsPhase()
                  toast({
                    title: "Transitioned to Adjustments Phase",
                    description: "You can now make adjustments to the model outputs.",
                  })
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <FileCog className="mr-2 h-4 w-4" />
                Begin Adjustments Phase
              </Button>
            )}
            {(runState === "MAIN_COMPLETE" || runState === "ADJUSTMENTS") && (
              <Button
                onClick={() => {
                  finalizeRun()
                  toast({
                    title: "Run Finalized",
                    description: "The run has been finalized and locked for audit purposes.",
                  })
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Finalize Run
              </Button>
            )}
            {paused && pausedModelId && (
              <Button onClick={handleContinueAfterBreakpoint} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Play className="mr-2 h-4 w-4" />
                Resume Run Past Breakpoint
              </Button>
            )}
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Start New Run
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Run Completion Options</CardTitle>
            {getStateBadge()}
          </div>
          <CardDescription>Manage run completion, sign-off, and iterations</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4 w-full">
              <TabsTrigger value="signoff">Sign-off</TabsTrigger>
              <TabsTrigger value="iterate">Iterate</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="signoff" className="space-y-4">
              {runState === "MAIN_COMPLETE" && (
                <Alert className="bg-amber-50 border-amber-200">
                  <ThermometerSun className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-700">Main Execution Complete</AlertTitle>
                  <AlertDescription className="text-amber-600">
                    All models have completed execution. You can now make adjustments or finalize the run.
                  </AlertDescription>
                </Alert>
              )}

              {runState === "ADJUSTMENTS" && (
                <Alert className="bg-amber-50 border-amber-200">
                  <ThermometerSun className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-700">Adjustments Phase</AlertTitle>
                  <AlertDescription className="text-amber-600">
                    You can make adjustments to models. Freeze models you want to preserve.
                  </AlertDescription>
                </Alert>
              )}

              {runState === "FINALIZED" && (
                <Alert className="bg-green-50 border-green-200">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">Run Finalized</AlertTitle>
                  <AlertDescription className="text-green-600">
                    This run has been finalized. You can sign it off or start a new iteration.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Run ID</div>
                  <div className="font-medium">{runId ? `#${runId.substring(runId.length - 8)}` : "—"}</div>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">{runDuration ? `${runDuration}s` : "—"}</div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {runState === "MAIN_COMPLETE" && (
                  <Button onClick={handleTransitionToAdjustments} className="w-full">
                    <ThermometerSun className="mr-2 h-4 w-4" />
                    Enter Adjustments Phase
                  </Button>
                )}

                {(runState === "MAIN_COMPLETE" || runState === "ADJUSTMENTS") && (
                  <Button
                    onClick={handleFinalizeRun}
                    className="w-full"
                    variant={runState === "ADJUSTMENTS" ? "default" : "outline"}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Finalize Run
                  </Button>
                )}

                {runState === "FINALIZED" && (
                  <Dialog open={signoffDialogOpen} onOpenChange={setSignoffDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <FileSignature className="mr-2 h-4 w-4" />
                        Sign Off Run
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sign Off Run</DialogTitle>
                        <DialogDescription>
                          Add your name and comments to officially sign off this run.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={signoffName}
                            onChange={(e) => setSignoffName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="comment" className="text-right">
                            Comments
                          </Label>
                          <Textarea
                            id="comment"
                            value={signoffComment}
                            onChange={(e) => setSignoffComment(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSignoffDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSignOffRun} disabled={!signoffName}>
                          <FileSignature className="mr-2 h-4 w-4" />
                          Sign Off
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </TabsContent>

            <TabsContent value="iterate" className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <RotateCw className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700">Iteration Options</AlertTitle>
                <AlertDescription className="text-blue-600">
                  Start a new iteration based on the current run. This will preserve certain settings and dependencies.
                </AlertDescription>
              </Alert>

              <div className="bg-muted rounded-md p-3">
                <div className="text-sm text-muted-foreground">Current Iteration</div>
                <div className="font-medium">{iterationCount > 0 ? `Iteration ${iterationCount}` : "Initial Run"}</div>
              </div>

              <Dialog open={iterationDialogOpen} onOpenChange={setIterationDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <RotateCw className="mr-2 h-4 w-4" />
                    Start New Iteration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Iteration</DialogTitle>
                    <DialogDescription>This will start a new iteration based on the current run.</DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="iterationName" className="text-right">
                        Iteration Name
                      </Label>
                      <Input
                        id="iterationName"
                        value={iterationName}
                        onChange={(e) => setIterationName(e.target.value)}
                        placeholder="e.g., Sensitivity Test 1"
                        className="col-span-3"
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                        <span className="text-sm font-medium text-amber-700">Warning</span>
                      </div>
                      <p className="text-xs text-amber-600 mt-1">
                        Starting a new iteration will reset all model outputs but preserve your model configuration and
                        dependencies.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIterationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleStartNewIteration}>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Start Iteration {iterationCount + 1}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save State
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Results
                </Button>
                <Button variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Run
                </Button>
                <Button variant="outline" className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Archive Run
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
