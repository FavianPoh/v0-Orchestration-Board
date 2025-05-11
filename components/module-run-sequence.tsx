"use client"

import { useState, useEffect, useRef } from "react"
import { useModelState } from "@/context/model-state-context"

export function ModuleRunSequence() {
  const { getExecutionSequence, modelGroups } = useModelState()
  const [executionSequence, setExecutionSequence] = useState<any[]>([])

  // Track if component is mounted
  const isMounted = useRef(true)

  // Initialize on mount and clean up on unmount
  useEffect(() => {
    isMounted.current = true

    // Get initial execution sequence
    const sequence = getExecutionSequence()
    setExecutionSequence(sequence)

    return () => {
      isMounted.current = false
    }
  }, [getExecutionSequence])

  // Update execution sequence when model groups change
  useEffect(() => {
    if (isMounted.current) {
      const sequence = getExecutionSequence()
      setExecutionSequence(sequence)
    }
  }, [modelGroups, getExecutionSequence])

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Module Run Sequence</h2>

      <div className="space-y-1">
        {executionSequence.map((model, index) => (
          <div
            key={model.id}
            className={`p-2 rounded flex items-center ${
              model.id.startsWith("test-model") ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full mr-2">{index + 1}</span>
            <span className="font-medium">{model.name}</span>
            <span className="text-xs text-gray-500 ml-2">({model.id})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
