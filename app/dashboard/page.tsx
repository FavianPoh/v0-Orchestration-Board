"use client"

import { RunDashboard } from "@/components/run-dashboard"
import { ModelExecutionDashboard } from "@/components/model-execution-dashboard"
import { RunCompletionOptions } from "@/components/run-completion-options"

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 max-w-full">
      <div className="grid grid-cols-1 gap-6">
        <h1 className="text-2xl font-bold">Run Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Model Execution Dashboard */}
          <div className="lg:col-span-1 space-y-6">
            <ModelExecutionDashboard />
            <RunCompletionOptions />
          </div>

          {/* Right column - Run Dashboard */}
          <div className="lg:col-span-2">
            <RunDashboard />
          </div>
        </div>
      </div>
    </div>
  )
}
