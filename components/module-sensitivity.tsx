"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ModuleSensitivityProps = {
  module: any
}

export function ModuleSensitivity({ module }: ModuleSensitivityProps) {
  // Update the useState hook that initializes ranges to handle object inputs
  const [ranges, setRanges] = useState(
    module.inputs.reduce((acc, input) => {
      // Check if the input value is a primitive (number, string) or an object
      const isComplexInput = typeof input.value === "object" && input.value !== null

      if (isComplexInput) {
        // For complex inputs like objects, we'll create a special range structure
        return {
          ...acc,
          [input.name]: {
            isComplex: true,
            value: input.value,
            original: input.value,
          },
        }
      } else {
        // For simple numeric inputs, keep the existing range structure
        const value = Number(input.value)
        return {
          ...acc,
          [input.name]: {
            min: value * 0.5,
            max: value * 1.5,
            step: value * 0.05,
            current: value,
            isComplex: false,
          },
        }
      }
    }, {}),
  )

  const [results, setResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("parameters")

  // Update the handleRangeChange function to handle complex inputs
  const handleRangeChange = (name: string, key: string, value: any) => {
    setRanges({
      ...ranges,
      [name]: {
        ...ranges[name],
        [key]: value,
      },
    })
  }

  const runSensitivityAnalysis = () => {
    // In a real app, this would run multiple simulations
    // For this example, we'll generate some sample results
    const newResults = []

    // Generate sample results for each input parameter
    for (const input of module.inputs) {
      const name = input.name
      const range = ranges[name]
      const baseValue = input.value

      // Generate 5 sample points for each parameter
      const step = (range.max - range.min) / 4
      for (let i = 0; i < 5; i++) {
        const inputValue = range.min + step * i
        let outputValue

        // Simulate output calculation based on module type
        if (module.id === "eco-1" && name === "growthRate") {
          // For GDP calculator, simulate effect of growth rate on projected GDP
          const baseGDP = 21500
          outputValue = baseGDP * (1 + inputValue / 100)
        } else if (module.id === "fin-1" && name === "inflation") {
          // For interest rate module, simulate effect of inflation on projected rate
          outputValue = 4.5 * 0.6 + inputValue * 0.3 + 2.5 * 0.1
        } else {
          // Generic simulation for other parameters
          const randomFactor = 0.8 + Math.random() * 0.4
          outputValue = inputValue * randomFactor
        }

        newResults.push({
          parameter: name,
          inputValue,
          outputName: module.outputs[0].name,
          outputValue,
          percentChange: ((inputValue - baseValue) / baseValue) * 100,
          outputPercentChange: ((outputValue - module.outputs[0].value) / module.outputs[0].value) * 100,
        })
      }
    }

    setResults(newResults)
    setActiveTab("results")
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number of Simulations</Label>
                <Input type="number" defaultValue="100" />
              </div>
              <div>
                <Label>Output Parameter</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                  {module.outputs.map((output) => (
                    <option key={output.name} value={output.name}>
                      {output.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6 mt-4">
              <h3 className="text-lg font-medium">Parameter Ranges</h3>

              {module.inputs.map((input) => (
                <Card key={input.name}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{input.name}</h4>
                      <span className="text-sm text-muted-foreground">
                        {ranges[input.name].isComplex ? "Complex Input" : `Base: ${input.value} ${input.unit}`}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {!ranges[input.name].isComplex ? (
                        // Render UI for simple numeric inputs
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`${input.name}-min`}>Minimum</Label>
                              <div className="flex items-center">
                                <Input
                                  id={`${input.name}-min`}
                                  type="number"
                                  value={ranges[input.name].min}
                                  onChange={(e) =>
                                    handleRangeChange(input.name, "min", Number.parseFloat(e.target.value))
                                  }
                                />
                                <span className="ml-2 text-muted-foreground">{input.unit}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`${input.name}-max`}>Maximum</Label>
                              <div className="flex items-center">
                                <Input
                                  id={`${input.name}-max`}
                                  type="number"
                                  value={ranges[input.name].max}
                                  onChange={(e) =>
                                    handleRangeChange(input.name, "max", Number.parseFloat(e.target.value))
                                  }
                                />
                                <span className="ml-2 text-muted-foreground">{input.unit}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${input.name}-step`}>Step Size</Label>
                            <div className="flex items-center">
                              <Input
                                id={`${input.name}-step`}
                                type="number"
                                value={ranges[input.name].step}
                                onChange={(e) =>
                                  handleRangeChange(input.name, "step", Number.parseFloat(e.target.value))
                                }
                              />
                              <span className="ml-2 text-muted-foreground">{input.unit}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>
                                Current Test Value: {ranges[input.name].current.toFixed(2)} {input.unit}
                              </Label>
                            </div>
                            <Slider
                              value={[ranges[input.name].current]}
                              min={ranges[input.name].min}
                              max={ranges[input.name].max}
                              step={ranges[input.name].step}
                              onValueChange={(value) => handleRangeChange(input.name, "current", value[0])}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {ranges[input.name].min.toFixed(2)} {input.unit}
                              </span>
                              <span>
                                {ranges[input.name].max.toFixed(2)} {input.unit}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Render UI for complex object inputs
                        <div className="space-y-4">
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm mb-2">Complex object input:</p>
                            <pre className="text-xs overflow-auto max-h-[150px]">
                              {JSON.stringify(ranges[input.name].value, null, 2)}
                            </pre>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sensitivity analysis for complex object inputs is not supported in this view. Please use the
                            module's direct interface to modify these values.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={runSensitivityAnalysis}>Run Sensitivity Analysis</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results">
          {results.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-lg font-medium mb-4">Sensitivity Results</h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Parameter</th>
                        <th className="text-left py-2 px-4">Input Value</th>
                        <th className="text-left py-2 px-4">% Change (Input)</th>
                        <th className="text-left py-2 px-4">Output Value</th>
                        <th className="text-left py-2 px-4">% Change (Output)</th>
                        <th className="text-left py-2 px-4">Elasticity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{result.parameter}</td>
                          <td className="py-2 px-4">{result.inputValue.toFixed(2)}</td>
                          <td className="py-2 px-4">{result.percentChange.toFixed(2)}%</td>
                          <td className="py-2 px-4">{result.outputValue.toFixed(2)}</td>
                          <td className="py-2 px-4">{result.outputPercentChange.toFixed(2)}%</td>
                          <td className="py-2 px-4">
                            {(result.outputPercentChange / result.percentChange).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="h-[300px] bg-muted rounded-md p-4 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">Sensitivity analysis chart would appear here</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    (In a real implementation, this would show tornado charts, scatter plots, etc.)
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("parameters")}>
                  Back to Parameters
                </Button>
                <Button>Export Results</Button>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Run sensitivity analysis to see results</p>
                <Button className="mt-4" onClick={() => setActiveTab("parameters")}>
                  Configure Parameters
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
