"use client"

import { useState, useEffect, useRef } from "react"
import { useModelState } from "@/context/model-state-context"
import { Progress } from "@/components/ui/progress"
import { timerManager } from "@/utils/timer-manager"

export function ExecutionMonitor() {
  const { modelGroups, getExecutionSequence } = useModelState()
  const [runningModels, setRunningModels] = useState<any[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  // Track if component is mounted
  const isMounted = useRef(true)

  // Initialize on mount and clean up on unmount
  useEffect(() => {
    isMounted.current = true

    // Start the elapsed time counter
    const intervalId = timerManager.setInterval(() => {
      if (startTimeRef.current && isMounted.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsedTime(elapsed)
      }
    }, 1000)

    return () => {
      isMounted.current = false
      timerManager.clearInterval(intervalId)
    }
  }, [])

  // Update running models when model groups change
  useEffect(() => {
    if (!isMounted.current) return

    // Find all currently running models
    const running = modelGroups.filter((model) => model.status === "running")
    setRunningModels(running)

    // Update start time if we have running models but no start time
    if (running.length > 0 && startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }

    // Reset start time if no models are running
    if (running.length === 0) {
      startTimeRef.current = null
      setElapsedTime(0)
    }
  }, [modelGroups])

  // If no models are running, show a message
  if (runningModels.length === 0) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Execution Monitor</h2>
        <p className="text-gray-600">No models currently running</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-2">Execution Monitor</h2>
      <p className="text-sm text-gray-600 mb-4">
        {runningModels.length} {runningModels.length === 1 ? "model" : "models"} currently running
      </p>

      {runningModels.map((model) => (
        <div key={model.id} className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm font-medium">{model.name}</span>
            </div>
            <span className="text-xs text-gray-500">{model.progress}%</span>
          </div>
          <Progress value={model.progress} className={timerManager.isPaused() ? "bg-amber-100" : ""} />
        </div>
      ))}

      <div className="mt-4 text-right text-sm text-gray-500">{elapsedTime}s elapsed</div>
    </div>
  )
}
