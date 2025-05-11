"use client"

import RunDashboard from "@/components/run-dashboard"
import { useModelState } from "@/context/model-state-context"

export default function RunBoard({ onRunAll }) {
  const { resetOutputs, runModel, getExecutionSequence } = useModelState()

  const handleRunAll = () => {
    // Reset outputs first
    resetOutputs()

    // Then run the first model in the sequence
    const sequence = getExecutionSequence()
    if (sequence.length > 0) {
      runModel(sequence[0].id)
    }

    // Call the parent's onRunAll if provided
    if (onRunAll) {
      onRunAll()
    }
  }

  return (
    <div className="container mx-auto py-6">
      <RunDashboard onRunAll={handleRunAll} />
    </div>
  )
}
