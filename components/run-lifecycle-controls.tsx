"use client"

import { useState, useEffect } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Play, CheckCircle, Clock, Snowflake, ThermometerSun, FileCheck, AlertTriangle, Info } from "lucide-react"

export function RunLifecycleControls() {
  const {
    getRunState,
    transitionToAdjustmentsPhase,
    finalizeRun,
    getFrozenModels,
    getModelById,
    isSimulationRunning,
    getRunId,
    getRunDuration,
  } = useModelState()
  const { toast } = useToast()
  const [refreshKey, setRefreshKey] = useState(0)

  const runState = getRunState()
  const frozenModels = getFrozenModels()
  const isRunning = isSimulationRunning()
  const runId = getRunId()
  const runDuration = getRunDuration()

  // Set up a refresh interval when simulation is running
  useEffect(() => {
    let intervalId
    if (isRunning) {
      intervalId = setInterval(() => {
        setRefreshKey((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isRunning])

  // Get the appropriate icon and color for the current run state
  const getRunStateInfo = () => {
    switch (runState) {
      case "IDLE":
        return {
          icon: <Clock className="h-5 w-5" />,
          color: "bg-gray-100 text-gray-600",
          label: "Idle",
        }
      case "INITIATED":
        return {
          icon: <Play className="h-5 w-5" />,
          color: "bg-blue-100 text-blue-600",
          label: "Initiated",
        }
      case "RUNNING":
        return {
          icon: <Play className="h-5 w-5 animate-pulse" />,
          color: "bg-blue-100 text-blue-600",
          label: "Running",
        }
      case "MAIN_COMPLETE":
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: "bg-green-100 text-green-600",
          label: "Main Complete",
        }
      case "ADJUSTMENTS":
        return {
          icon: <ThermometerSun className="h-5 w-5" />,
          color: "bg-amber-100 text-amber-600",
          label: "Adjustments",
        }
      case "FINALIZED":
        return {
          icon: <FileCheck className="h-5 w-5" />,
          color: "bg-green-100 text-green-600",
          label: "Finalized",
        }
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          color: "bg-gray-100 text-gray-600",
          label: runState,
        }
    }
  }

  const handleTransitionToAdjustments = () => {
    transitionToAdjustmentsPhase()
    toast({
      title: "Entered Adjustments Phase",
      description: "You can now make adjustments to models while preserving completed results.",
    })
  }

  const handleFinalizeRun = () => {
    finalizeRun()
    toast({
      title: "Run Finalized",
      description: "The run has been finalized and results are now locked.",
    })
  }

  const stateInfo = getRunStateInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Run Lifecycle</span>
          <Badge className={`${stateInfo.color} flex items-center gap-1 px-3 py-1`}>
            {stateInfo.icon}
            {stateInfo.label}
          </Badge>
        </CardTitle>
        <CardDescription>Manage the current run state and frozen models</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-md p-3">
            <div className="text-sm text-muted-foreground">Run ID</div>
            <div className="font-medium">{getRunId() ? `#${getRunId()}` : "New Run"}</div>
          </div>
          <div className="bg-muted rounded-md p-3">
            <div className="text-sm text-muted-foreground">Duration</div>
            <div className="font-medium">{runDuration ? `${runDuration}s` : "—"}</div>
          </div>
        </div>

        {/* Frozen Models */}
        <div>
          <h3 className="text-sm font-medium mb-2">Frozen Models ({frozenModels.length})</h3>
          {frozenModels.length > 0 ? (
            <div className="space-y-2">
              {frozenModels.map((modelId) => {
                const model = getModelById(modelId)
                return (
                  <div
                    key={modelId}
                    className="flex items-center justify-between bg-blue-50 p-2 rounded-md border border-blue-200"
                  >
                    <div className="flex items-center">
                      <Snowflake className="h-4 w-4 text-blue-500 mr-2" />
                      <span>{model?.name || modelId}</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100">
                      Frozen
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">No frozen models</div>
          )}
        </div>

        {/* State Transition Controls */}
        <div className="space-y-2">
          {runState === "MAIN_COMPLETE" && (
            <>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700">Main Execution Complete</AlertTitle>
                <AlertDescription className="text-amber-600">
                  All models have completed execution. You can now make adjustments or finalize the run.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={handleTransitionToAdjustments} className="flex-1" variant="outline">
                  <ThermometerSun className="mr-2 h-4 w-4" />
                  Enter Adjustments Phase
                </Button>
                <Button onClick={handleFinalizeRun} className="flex-1">
                  <FileCheck className="mr-2 h-4 w-4" />
                  Finalize Run
                </Button>
              </div>
            </>
          )}

          {runState === "ADJUSTMENTS" && (
            <>
              <Alert className="bg-amber-50 border-amber-200">
                <ThermometerSun className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700">Adjustments Phase</AlertTitle>
                <AlertDescription className="text-amber-600">
                  You can make adjustments to models. Freeze models you want to preserve.
                </AlertDescription>
              </Alert>
              <Button onClick={handleFinalizeRun} className="w-full">
                <FileCheck className="mr-2 h-4 w-4" />
                Finalize Run
              </Button>
            </>
          )}

          {runState === "FINALIZED" && (
            <Alert className="bg-green-50 border-green-200">
              <FileCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Run Finalized</AlertTitle>
              <AlertDescription className="text-green-600">
                This run has been finalized. Start a new run to make changes.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
