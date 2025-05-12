"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModelRunTimeline } from "@/components/model-run-timeline"
import { EnhancedExecutionSequence } from "@/components/enhanced-execution-sequence"
import { RunLifecycleControls } from "@/components/run-lifecycle-controls"
import { ModelExecutionDashboard } from "@/components/model-execution-dashboard"
import { RunCompletionOptions } from "@/components/run-completion-options"
import { useModelState } from "@/context/model-state-context"

interface RunBoardProps {
  modelGroups: any[]
  onRunAll?: () => void
  onRunSelected?: (modelId: string) => void
  onResetOutputs?: () => void
  parallelExecution?: boolean // Keep this prop
  onToggleParallelExecution?: () => void
}

export function RunBoard({
  modelGroups,
  onRunAll,
  onRunSelected,
  onResetOutputs,
  parallelExecution = false, // Keep this prop with default
  onToggleParallelExecution,
}: RunBoardProps) {
  const { getRunState, isSimulationRunning } = useModelState()
  const runState = getRunState()
  const isRunning = isSimulationRunning()

  // Check if run is in a state where completion options should be shown
  const showCompletionOptions = runState === "MAIN_COMPLETE" || runState === "ADJUSTMENTS" || runState === "FINALIZED"

  // Function to toggle parallel execution mode
  const handleToggleParallelExecution = () => {
    // This is a placeholder - the actual toggle happens at the parent level
    // We'll just pass this to the EnhancedExecutionSequence component
    if (onToggleParallelExecution) {
      onToggleParallelExecution()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Column - Run Lifecycle and Model Run Timeline (thinner) */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Run Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <RunLifecycleControls modelGroups={modelGroups} onRunAll={onRunAll} onResetOutputs={onResetOutputs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Model Run Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ModelRunTimeline modelGroups={modelGroups} />
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Execution Sequence (broader) */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Status Dashboard Cards */}
        <ModelExecutionDashboard />

        {/* Run Completion Options - Only shown when run is complete */}
        {showCompletionOptions && <RunCompletionOptions />}

        {/* Model Execution Sequence */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Model Execution Sequence</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <EnhancedExecutionSequence
              modelGroups={modelGroups}
              parallelExecution={parallelExecution} // Pass the prop here
              onToggleParallelExecution={handleToggleParallelExecution}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RunBoard
