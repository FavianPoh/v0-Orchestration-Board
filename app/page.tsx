"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BarChart3, PlayCircle, Sliders, RefreshCw } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Force remove any problematic attributes
            document.documentElement.removeAttribute("data-simulation-running")
            document.documentElement.removeAttribute("data-breakpoint-active")

            // Clear localStorage to reset any persisted problematic state
            localStorage.removeItem("modelState")
            localStorage.removeItem("executionOrder")

            console.log("Emergency reset triggered - cleared DOM attributes and localStorage")

            // Force refresh the page
            window.location.reload()
          }}
          title="Emergency Reset - Use if the app gets stuck"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Emergency Reset
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to FlowOrchestrator</h1>
        <p className="text-muted-foreground">
          Orchestrate module groups, run workflows, and perform sensitivity analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlayCircle className="mr-2 h-5 w-5 text-primary" />
              Workflow Orchestration
            </CardTitle>
            <CardDescription>Design and manage workflows connecting module groups</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Create, edit, and monitor workflows that orchestrate your module groups. Visualize dependencies and
              execution flow.
            </p>
            <Button asChild>
              <Link href="/workflows">Go to Workflows</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Module Groups
            </CardTitle>
            <CardDescription>Manage your module groups and their components</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Configure module groups containing granular modules. Set up inputs, outputs, and processing logic.
            </p>
            <Button asChild>
              <Link href="/module-groups/economic">Explore Module Groups</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sliders className="mr-2 h-5 w-5 text-primary" />
              Sensitivity Analysis
            </CardTitle>
            <CardDescription>Analyze how input changes affect your workflow results</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Perform sensitivity analysis by varying inputs within ranges. Freeze specific segments to exclude them
              from recalculation.
            </p>
            <Button asChild>
              <Link href="/sensitivity">Run Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
