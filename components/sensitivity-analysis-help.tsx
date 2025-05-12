"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, Info, X } from "lucide-react"

export function SensitivityAnalysisHelp() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="h-8 px-2">
        <HelpCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">How It Works</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Sensitivity Analysis Guide</CardTitle>
                <CardDescription>Understanding how sensitivity analysis works in the workflow</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pre-run">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pre-run">Pre-Run Analysis</TabsTrigger>
                  <TabsTrigger value="during-run">During-Run Analysis</TabsTrigger>
                  <TabsTrigger value="post-run">Post-Run Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="pre-run" className="space-y-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Pre-Run Sensitivity Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Pre-run analysis allows you to test how changes to input parameters might affect model outputs
                        before actually running the models. This helps in planning and understanding potential impacts.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Default Behavior</h4>
                    <p className="text-sm">
                      By default, pre-run sensitivity analysis shows the current parameter values but does not apply any
                      changes until you explicitly:
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Manually adjust individual parameters</li>
                      <li>Apply a predefined scenario</li>
                      <li>Run the sensitivity analysis to see potential impacts</li>
                    </ul>
                    <p className="text-sm">
                      <Badge variant="outline" className="mr-1">
                        Important
                      </Badge>
                      Changes made in pre-run analysis are not applied to the actual model run until you click "Apply
                      Changes & Run Models" after reviewing the analysis results.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Working with Parameters</h4>
                    <p className="text-sm">Each parameter shows:</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>
                        <span className="font-medium">Impact level</span> - How much direct influence this parameter has
                        on model outputs
                      </li>
                      <li>
                        <span className="font-medium">Models affected</span> - How many models are directly or
                        indirectly impacted by changes to this parameter
                      </li>
                      <li>
                        <span className="font-medium">Primary area</span> - The main functional area this parameter
                        affects
                      </li>
                    </ul>
                    <p className="text-sm">
                      Parameters with higher impact levels and more affected models will generally have more significant
                      effects on the overall results.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Using Scenarios</h4>
                    <p className="text-sm">
                      Predefined scenarios provide a quick way to test common economic or market conditions:
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Each scenario adjusts multiple parameters simultaneously</li>
                      <li>The severity slider lets you control the intensity of the scenario</li>
                      <li>You can further customize individual parameters after applying a scenario if needed</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="during-run" className="space-y-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">During-Run Sensitivity Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        During-run analysis is available at breakpoints, allowing you to test parameter changes and see
                        their impact on downstream models before continuing execution.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">How It Works</h4>
                    <p className="text-sm">
                      When a model hits a breakpoint, you can perform sensitivity analysis on its outputs and
                      parameters:
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Adjust parameters and see which downstream models would be affected</li>
                      <li>
                        The system will recommend which models should be fully recalculated vs. approximated based on
                        thresholds
                      </li>
                      <li>You can choose to continue with original values or apply the changes</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="post-run" className="space-y-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Post-Run Sensitivity Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        After a run completes, post-run analysis lets you explore "what-if" scenarios based on the
                        actual results, helping you understand how different inputs might have changed the outcome.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Creating New Iterations</h4>
                    <p className="text-sm">
                      Post-run analysis allows you to create new iterations based on sensitivity findings:
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Compare original results with potential alternative scenarios</li>
                      <li>Create a new iteration with modified parameters</li>
                      <li>Choose between full recalculation or selective updates based on sensitivity thresholds</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsOpen(false)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
