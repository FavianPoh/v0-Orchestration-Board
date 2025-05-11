"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, RefreshCw, Settings, List, Sliders, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type ModelGroup = {
  id: string
  name: string
  status: "idle" | "running" | "paused" | "completed" | "error"
  enabled: boolean
  frozen: boolean
  breakpoint?: boolean
  progress: number
  outputs?: Array<{ name: string; value: string; unit: string }>
  modules?: Array<{ id: string; name: string; description: string }>
}

type WorkflowOrchestrationSidebarProps = {
  modelGroups: ModelGroup[]
  onUpdateModelGroup: (id: string, updates: Partial<ModelGroup>) => void
  onRunAll: () => void
  onPauseAll: () => void
  onResetAll: () => void
  onRunSelected: () => void
  executionSpeed: number
  onExecutionSpeedChange: (value: number) => void
  isRunning: boolean
}

export function WorkflowOrchestrationSidebar({
  modelGroups,
  onUpdateModelGroup,
  onRunAll,
  onPauseAll,
  onResetAll,
  onRunSelected,
  executionSpeed,
  onExecutionSpeedChange,
  isRunning,
}: WorkflowOrchestrationSidebarProps) {
  const [activeTab, setActiveTab] = useState("models")
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  // Status icons
  const statusIcons = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    running: <Play className="h-4 w-4 text-blue-500" />,
    paused: <Pause className="h-4 w-4 text-yellow-500" />,
    idle: <Clock className="h-4 w-4 text-gray-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
  }

  // Toggle module expansion
  const toggleModuleExpansion = (groupId: string) => {
    setExpandedModules((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Workflow Controls</h2>
        <div className="flex flex-col gap-2">
          {isRunning ? (
            <Button onClick={onPauseAll} variant="outline" className="w-full">
              <Pause className="mr-2 h-4 w-4" />
              Pause All
            </Button>
          ) : (
            <Button onClick={onRunAll} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Run All
            </Button>
          )}
          <Button onClick={onRunSelected} variant="outline" className="w-full">
            <Play className="mr-2 h-4 w-4" />
            Run Selected
          </Button>
          <Button onClick={onResetAll} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset All
          </Button>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="execution-speed">Execution Speed</Label>
            <span className="text-sm">{executionSpeed}x</span>
          </div>
          <Slider
            id="execution-speed"
            min={0.5}
            max={3}
            step={0.5}
            value={[executionSpeed]}
            onValueChange={(value) => onExecutionSpeedChange(value[0])}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="w-full">
            <TabsTrigger value="models" className="flex-1">
              <List className="mr-2 h-4 w-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex-1">
              <Sliders className="mr-2 h-4 w-4" />
              Modules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="models" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {modelGroups.map((group) => (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm flex items-center">
                        {statusIcons[group.status]}
                        <span className="ml-2">{group.name}</span>
                      </CardTitle>
                      <Badge
                        className={
                          group.status === "completed"
                            ? "bg-green-500"
                            : group.status === "running"
                              ? "bg-blue-500"
                              : group.status === "paused"
                                ? "bg-yellow-500"
                                : group.status === "error"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                        }
                      >
                        {group.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {group.status === "running" && <Progress value={group.progress} className="h-2 mb-2" />}

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`enabled-${group.id}`}
                          checked={group.enabled}
                          onCheckedChange={(checked) => onUpdateModelGroup(group.id, { enabled: checked as boolean })}
                        />
                        <Label htmlFor={`enabled-${group.id}`} className="text-xs">
                          Enabled
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`frozen-${group.id}`}
                          checked={group.frozen}
                          onCheckedChange={(checked) => onUpdateModelGroup(group.id, { frozen: checked as boolean })}
                        />
                        <Label htmlFor={`frozen-${group.id}`} className="text-xs">
                          Frozen
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`breakpoint-${group.id}`}
                          checked={group.breakpoint}
                          onCheckedChange={(checked) =>
                            onUpdateModelGroup(group.id, { breakpoint: checked as boolean })
                          }
                        />
                        <Label htmlFor={`breakpoint-${group.id}`} className="text-xs">
                          Breakpoint
                        </Label>
                      </div>
                    </div>

                    {group.outputs && group.outputs.length > 0 && (
                      <div className="text-xs">
                        <div className="font-medium mb-1">Outputs:</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {group.outputs.map((output, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-muted-foreground">{output.name}:</span>
                              <span className="font-medium">
                                {output.value} {output.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">Execution Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="parallel-execution" className="text-sm">
                        Max Parallel Executions
                      </Label>
                      <div className="flex items-center space-x-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                          -
                        </Button>
                        <span className="w-8 text-center">3</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm">Execution Mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="justify-start">
                        <Play className="mr-2 h-4 w-4" />
                        Sequential
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start bg-muted">
                        <Play className="mr-2 h-4 w-4" />
                        Parallel
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-continue" className="text-sm">
                        Auto-continue after breakpoint
                      </Label>
                      <Switch id="auto-continue" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="skip-errors" className="text-sm">
                        Skip errors and continue
                      </Label>
                      <Switch id="skip-errors" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">Dependency Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="strict-dependencies" className="text-sm">
                        Strict dependency checking
                      </Label>
                      <Switch id="strict-dependencies" checked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="conditional-deps" className="text-sm">
                        Enable conditional dependencies
                      </Label>
                      <Switch id="conditional-deps" checked={true} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="modules" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Accordion type="multiple" className="w-full">
                {modelGroups.map((group) => (
                  <AccordionItem key={group.id} value={group.id}>
                    <AccordionTrigger className="py-2 px-3 text-sm">
                      <div className="flex items-center">
                        {statusIcons[group.status]}
                        <span className="ml-2">{group.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-0">
                      {group.modules && group.modules.length > 0 ? (
                        <div className="space-y-3">
                          {group.modules.map((module) => (
                            <Card key={module.id} className="overflow-hidden">
                              <CardHeader className="p-2 pb-1">
                                <CardTitle className="text-xs">{module.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-2 pt-0">
                                <p className="text-xs text-muted-foreground">{module.description}</p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox id={`module-enabled-${module.id}`} defaultChecked />
                                    <Label htmlFor={`module-enabled-${module.id}`} className="text-xs">
                                      Enabled
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox id={`module-breakpoint-${module.id}`} />
                                    <Label htmlFor={`module-breakpoint-${module.id}`} className="text-xs">
                                      Breakpoint
                                    </Label>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No modules available</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
