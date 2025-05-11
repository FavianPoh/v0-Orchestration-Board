"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Code, History, Info, Settings } from "lucide-react"
import { LineChart } from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useModelState } from "@/context/model-state-context"

export default function ModuleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [module, setModule] = useState(null)
  const [modelGroup, setModelGroup] = useState(null)
  const [inputValues, setInputValues] = useState({})
  const [outputValues, setOutputValues] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const { getModuleById, updateModuleInGroup } = useModelState()

  useEffect(() => {
    const moduleId = params.id
    if (moduleId) {
      const result = getModuleById(moduleId)
      if (result) {
        const { module: foundModule, modelGroup: foundModelGroup } = result
        setModule(foundModule)
        setModelGroup(foundModelGroup)

        // Initialize input values
        const initialInputs = {}
        foundModule.inputs?.forEach((input) => {
          initialInputs[input.id] = input.value
        })
        setInputValues(initialInputs)

        // Initialize output values
        const initialOutputs = {}
        foundModule.outputs?.forEach((output) => {
          initialOutputs[output.name] = output.value
        })
        setOutputValues(initialOutputs)
      }
    }
  }, [params.id, getModuleById])

  if (!module || !modelGroup) {
    return <div className="container mx-auto p-6">Module not found</div>
  }

  const handleInputChange = (inputId, value) => {
    setInputValues((prev) => ({
      ...prev,
      [inputId]: value,
    }))
    setIsEditing(true)
  }

  const handleSliderChange = (inputId, values) => {
    setInputValues((prev) => ({
      ...prev,
      [inputId]: values[0],
    }))
    setIsEditing(true)
  }

  const applyInputs = () => {
    // In a real app, this would call the actual module function with the new inputs
    // For now, we'll simulate it with a timeout
    toast({
      title: "Processing inputs...",
      description: "Applying new input values to the module.",
    })

    setTimeout(() => {
      // Simulate recalculating outputs
      const newOutputs = {}
      module.outputs.forEach((output, index) => {
        // Simple simulation - in reality this would use the actual module function
        const baseValue = typeof output.value === "string" ? Number.parseFloat(output.value) || 0 : output.value
        const adjustment = (Math.random() - 0.5) * 0.2 * baseValue
        newOutputs[output.name] = baseValue + adjustment
      })

      setOutputValues(newOutputs)
      setIsEditing(false)

      toast({
        title: "Inputs applied",
        description: "Module has been executed with the new input values.",
      })
    }, 1000)
  }

  const resetInputs = () => {
    // Reset to original values
    const originalInputs = {}
    module.inputs?.forEach((input) => {
      originalInputs[input.id] = input.value
    })
    setInputValues(originalInputs)
    setIsEditing(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="ml-2">
          <h1 className="text-2xl font-bold">{module.name}</h1>
          <div className="flex items-center mt-1">
            <span className="text-sm text-muted-foreground mr-2">Part of {modelGroup.name}</span>
            {module.optional && <Badge variant="outline">Optional</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Module Details</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">
                    <Info className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="parameters">
                    <Settings className="mr-2 h-4 w-4" />
                    Parameters
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <Code className="mr-2 h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="mr-2 h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              module.status === "completed"
                                ? "bg-green-500"
                                : module.status === "running"
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                            }`}
                          ></div>
                          <span className="text-lg font-medium capitalize">{module.status}</span>
                          {module.executionTime && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Execution time: {module.executionTime}s
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Last Run</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-medium">
                            {module.lastRun ? new Date(module.lastRun).toLocaleString() : "Never"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Outputs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {module.outputs?.map((output, index) => (
                            <div key={index} className="bg-muted p-3 rounded-md">
                              <p className="text-sm text-muted-foreground">{output.name}</p>
                              <p className="text-lg font-medium">
                                {outputValues[output.name] !== undefined
                                  ? typeof outputValues[output.name] === "number"
                                    ? outputValues[output.name].toFixed(1)
                                    : outputValues[output.name]
                                  : output.value}{" "}
                                {output.unit && <span className="text-sm text-muted-foreground">{output.unit}</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Dependencies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Depends on:</h4>
                            {module.dependencies?.length > 0 ? (
                              <div className="space-y-2">
                                {module.dependencies.map((depId, index) => {
                                  const depModule = getModuleById(depId)?.module
                                  return (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="mr-2"
                                      onClick={() => router.push(`/module-details/${depId}`)}
                                    >
                                      {depModule?.name || depId}
                                    </Button>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No dependencies</p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Used by:</h4>
                            {module.dependents?.length > 0 ? (
                              <div className="space-y-2">
                                {module.dependents.map((depId, index) => {
                                  const depModule = getModuleById(depId)?.module
                                  return (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="mr-2"
                                      onClick={() => router.push(`/module-details/${depId}`)}
                                    >
                                      {depModule?.name || depId}
                                    </Button>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No dependents</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="parameters" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Input Parameters</CardTitle>
                      <CardDescription>Adjust the input parameters to see how they affect the outputs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {module.inputs?.map((input) => (
                          <div key={input.id} className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor={input.id}>{input.name}</Label>
                              <div className="flex items-center">
                                <Input
                                  id={`${input.id}-value`}
                                  type="number"
                                  value={inputValues[input.id]}
                                  onChange={(e) => handleInputChange(input.id, Number.parseFloat(e.target.value))}
                                  className="w-20 h-8"
                                  step={0.1}
                                  min={input.min}
                                  max={input.max}
                                />
                                <span className="ml-2 text-sm text-muted-foreground">{input.unit}</span>
                              </div>
                            </div>
                            <Slider
                              id={input.id}
                              value={[inputValues[input.id]]}
                              min={input.min}
                              max={input.max}
                              step={0.1}
                              onValueChange={(values) => handleSliderChange(input.id, values)}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{input.min}</span>
                              <span>{input.max}</span>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end space-x-2 mt-6">
                          <Button variant="outline" onClick={resetInputs} disabled={!isEditing}>
                            Reset
                          </Button>
                          <Button onClick={applyInputs} disabled={!isEditing}>
                            Apply Inputs
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="code" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Module Implementation</CardTitle>
                      <CardDescription>The code that implements this module's logic</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted">
                        <pre className="text-sm font-mono">{module.code}</pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historical Data</CardTitle>
                      <CardDescription>Historical values for the primary output</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <LineChart
                          data={module.history?.map((item) => ({
                            date: item.date,
                            value: item.value,
                          }))}
                          index="date"
                          categories={["value"]}
                          colors={["blue"]}
                          valueFormatter={(value) => `${value} ${module.outputs?.[0]?.unit || ""}`}
                          showLegend={false}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" disabled={module.status === "completed"}>
                  Run Module
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/model-groups/${modelGroup.id}`)}
                >
                  View Parent Model
                </Button>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Status</Label>
                    <Badge
                      className={
                        module.status === "completed"
                          ? "bg-green-500"
                          : module.status === "running"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                      }
                    >
                      {module.status}
                    </Badge>
                  </div>
                  {module.optional && (
                    <div className="flex items-center justify-between">
                      <Label>Optional</Label>
                      <Badge variant="outline">Yes</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label>Execution Time</Label>
                    <span>{module.executionTime ? `${module.executionTime}s` : "N/A"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Related Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {module.dependencies?.map((depId) => {
                  const depModule = getModuleById(depId)?.module
                  return (
                    <div key={depId} className="flex justify-between items-center">
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => router.push(`/module-details/${depId}`)}
                      >
                        {depModule?.name || depId}
                      </Button>
                      <Badge variant="outline">Dependency</Badge>
                    </div>
                  )
                })}
                {module.dependents?.map((depId) => {
                  const depModule = getModuleById(depId)?.module
                  return (
                    <div key={depId} className="flex justify-between items-center">
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => router.push(`/module-details/${depId}`)}
                      >
                        {depModule?.name || depId}
                      </Button>
                      <Badge variant="outline">Dependent</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
