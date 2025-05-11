"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SensitivityControls } from "@/components/sensitivity-controls"
import { DashboardCharts } from "@/components/dashboard-charts"
import { SensitivityResults } from "@/components/sensitivity-results"

export default function SensitivityPage() {
  const [analysisRun, setAnalysisRun] = useState(false)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sensitivity Analysis</h1>
          <p className="text-muted-foreground">Analyze how input changes affect workflow results</p>
        </div>
        <div>
          <Button onClick={() => setAnalysisRun(true)}>Run Analysis</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Parameters</CardTitle>
              <CardDescription>Configure input parameters and ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <SensitivityControls />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>Visualization of sensitivity analysis results</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisRun ? (
                <Tabs defaultValue="tornado">
                  <TabsList>
                    <TabsTrigger value="tornado">Tornado Chart</TabsTrigger>
                    <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
                    <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tornado" className="pt-4">
                    <DashboardCharts type="sensitivity" />
                  </TabsContent>

                  <TabsContent value="scatter" className="pt-4">
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Scatter plot visualization
                    </div>
                  </TabsContent>

                  <TabsContent value="heatmap" className="pt-4">
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Heatmap visualization
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Run sensitivity analysis to see results
                </div>
              )}
            </CardContent>
          </Card>

          {analysisRun && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Detailed Results</CardTitle>
                <CardDescription>Numerical results of sensitivity analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <SensitivityResults />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
