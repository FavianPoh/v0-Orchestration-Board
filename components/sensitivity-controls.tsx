"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { LockIcon, UnlockIcon } from "lucide-react"

type Parameter = {
  id: string
  name: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  moduleGroup: string
  frozen: boolean
}

const initialParameters: Parameter[] = [
  {
    id: "gdp-growth",
    name: "GDP Growth Rate",
    value: 2.5,
    min: -5,
    max: 10,
    step: 0.1,
    unit: "%",
    moduleGroup: "Economic Models",
    frozen: false,
  },
  {
    id: "inflation-rate",
    name: "Inflation Rate",
    value: 3.2,
    min: 0,
    max: 15,
    step: 0.1,
    unit: "%",
    moduleGroup: "Economic Models",
    frozen: false,
  },
  {
    id: "interest-rate",
    name: "Interest Rate",
    value: 4.5,
    min: 0,
    max: 20,
    step: 0.25,
    unit: "%",
    moduleGroup: "Financial Models",
    frozen: true,
  },
  {
    id: "unemployment",
    name: "Unemployment Rate",
    value: 5.8,
    min: 0,
    max: 25,
    step: 0.1,
    unit: "%",
    moduleGroup: "Economic Models",
    frozen: false,
  },
  {
    id: "market-volatility",
    name: "Market Volatility",
    value: 15,
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    moduleGroup: "Risk Assessment",
    frozen: false,
  },
]

export function SensitivityControls() {
  const [parameters, setParameters] = useState<Parameter[]>(initialParameters)
  const [runCount, setRunCount] = useState<number>(100)

  const handleSliderChange = (id: string, value: number[]) => {
    setParameters(parameters.map((param) => (param.id === id ? { ...param, value: value[0] } : param)))
  }

  const handleFreezeToggle = (id: string) => {
    setParameters(parameters.map((param) => (param.id === id ? { ...param, frozen: !param.frozen } : param)))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="run-count">Number of Simulation Runs</Label>
          <Input
            id="run-count"
            type="number"
            value={runCount}
            onChange={(e) => setRunCount(Number.parseInt(e.target.value))}
            min={1}
            max={1000}
          />
        </div>
        <div className="space-y-2">
          <Label>Sensitivity Method</Label>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Monte Carlo
            </Button>
            <Button variant="outline" className="flex-1">
              One-at-a-time
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Input Parameters</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Reset All
            </Button>
            <Button variant="outline" size="sm">
              Freeze All
            </Button>
          </div>
        </div>

        {parameters.map((param) => (
          <div key={param.id} className="border rounded-md p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{param.name}</h4>
                  <Badge variant="outline">{param.moduleGroup}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Range: {param.min} to {param.max} {param.unit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFreezeToggle(param.id)}
                  className={param.frozen ? "text-blue-500" : "text-gray-400"}
                >
                  {param.frozen ? <LockIcon className="h-4 w-4" /> : <UnlockIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_80px] gap-4 items-center">
              <Slider
                value={[param.value]}
                min={param.min}
                max={param.max}
                step={param.step}
                onValueChange={(value) => handleSliderChange(param.id, value)}
                disabled={param.frozen}
              />
              <div className="flex items-center">
                <Input
                  type="number"
                  value={param.value}
                  onChange={(e) => handleSliderChange(param.id, [Number.parseFloat(e.target.value)])}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  disabled={param.frozen}
                  className="h-8"
                />
                <span className="ml-1">{param.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <div className="flex items-center space-x-2">
          <Switch id="auto-update" />
          <Label htmlFor="auto-update">Auto-update results</Label>
        </div>
        <Button>Run Sensitivity Analysis</Button>
      </div>
    </div>
  )
}
