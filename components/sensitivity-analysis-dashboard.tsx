"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useModelState } from "@/context/model-state-context"
import {
  Play,
  RefreshCw,
  AlertCircle,
  Sliders,
  BarChart2,
  Zap,
  Layers,
  Thermometer,
  ChevronRight,
  AlertTriangle,
  WormIcon as Virus,
  Briefcase,
  Globe,
  TrendingDown,
  TrendingUp,
  Building,
  DollarSign,
  Cloud,
  CheckCircle,
} from "lucide-react"
import { SensitivityAnalysisHelp } from "@/components/sensitivity-analysis-help"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BarChart } from "@/components/ui/bar-chart"

// Define types for sensitivity parameters and thresholds
type ParameterThreshold = {
  id: string
  name: string
  absoluteThreshold: number
  percentageThreshold: number
  useAbsolute: boolean
  unit: string
}

type OutputMetricThreshold = {
  id: string
  metricName: string
  modelId: string
  modelName: string
  absoluteThreshold: number
  percentageThreshold: number
  useAbsolute: boolean
  unit: string
}

type SensitivityScenario = {
  id: string
  name: string
  description: string
  severity: number // 0-100
  parameterChanges: {
    parameterId: string
    changeType: "absolute" | "percentage"
    changeValue: number
  }[]
}

// Default thresholds for parameters and outputs
const DEFAULT_PARAMETER_THRESHOLDS = {
  "base-growth-rate": { absoluteThreshold: 0.5, percentageThreshold: 5, useAbsolute: true },
  "interest-rate": { absoluteThreshold: 1.0, percentageThreshold: 5, useAbsolute: true },
  "current-assets": { absoluteThreshold: 50000, percentageThreshold: 5, useAbsolute: false },
  "money-supply-growth": { absoluteThreshold: 0.5, percentageThreshold: 5, useAbsolute: true },
  "current-liabilities": { absoluteThreshold: 50000, percentageThreshold: 5, useAbsolute: false },
  "labor-force-participation": { absoluteThreshold: 1.0, percentageThreshold: 5, useAbsolute: true },
  "corporate-earnings": { absoluteThreshold: 50000, percentageThreshold: 8, useAbsolute: false },
  "asset-growth-multiplier": { absoluteThreshold: 0.2, percentageThreshold: 5, useAbsolute: true },
  "default-correlation": { absoluteThreshold: 0.05, percentageThreshold: 10, useAbsolute: true },
  "cash-flow-projection": { absoluteThreshold: 25000, percentageThreshold: 8, useAbsolute: false },
  "risk-free-rate": { absoluteThreshold: 0.3, percentageThreshold: 5, useAbsolute: true },
  "inflation-rate": { absoluteThreshold: 0.5, percentageThreshold: 8, useAbsolute: true },
  "unemployment-rate": { absoluteThreshold: 0.5, percentageThreshold: 8, useAbsolute: true },
  "market-volatility": { absoluteThreshold: 5, percentageThreshold: 10, useAbsolute: false },
}

const DEFAULT_OUTPUT_THRESHOLDS = {
  // Model metrics typically have percentage-based thresholds
  "economic-models": { absoluteThreshold: 0.5, percentageThreshold: 10, useAbsolute: false },
  "financial-models": { absoluteThreshold: 0.5, percentageThreshold: 10, useAbsolute: false },
  "risk-models": { absoluteThreshold: 0.5, percentageThreshold: 15, useAbsolute: false },
  "market-models": { absoluteThreshold: 1.0, percentageThreshold: 12, useAbsolute: false },
  "balance-sheet-models": { absoluteThreshold: 50000, percentageThreshold: 8, useAbsolute: false },
}

// Predefined scenarios
const predefinedScenarios: SensitivityScenario[] = [
  {
    id: "financial-crisis-2008",
    name: "2008 Financial Crisis",
    description: "Simulates conditions similar to the 2008 global financial crisis",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: -3.5 },
      { parameterId: "unemployment-rate", changeType: "absolute", changeValue: 5.0 },
      { parameterId: "interest-rate", changeType: "absolute", changeValue: -2.0 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 150 },
      { parameterId: "inflation-rate", changeType: "absolute", changeValue: -1.0 },
      { parameterId: "current-assets", changeType: "percentage", changeValue: -25 },
      { parameterId: "current-liabilities", changeType: "percentage", changeValue: 15 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: -40 },
      { parameterId: "default-correlation", changeType: "absolute", changeValue: 0.3 },
      { parameterId: "risk-free-rate", changeType: "absolute", changeValue: -1.5 },
    ],
  },
  {
    id: "trade-war",
    name: "Global Trade War",
    description: "Simulates impact of escalating tariffs and trade restrictions",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: -1.5 },
      { parameterId: "inflation-rate", changeType: "absolute", changeValue: 2.0 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 80 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: -20 },
      { parameterId: "current-assets", changeType: "percentage", changeValue: -10 },
      { parameterId: "labor-force-participation", changeType: "absolute", changeValue: -1.2 },
      { parameterId: "cash-flow-projection", changeType: "percentage", changeValue: -15 },
    ],
  },
  {
    id: "pandemic",
    name: "Pandemic Scenario (SARS-like)",
    description: "Simulates economic impact of a global health crisis",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: -2.8 },
      { parameterId: "unemployment-rate", changeType: "absolute", changeValue: 3.5 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 120 },
      { parameterId: "labor-force-participation", changeType: "absolute", changeValue: -3.0 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: -30 },
      { parameterId: "cash-flow-projection", changeType: "percentage", changeValue: -25 },
      { parameterId: "current-liabilities", changeType: "percentage", changeValue: 10 },
    ],
  },
  {
    id: "tech-boom",
    name: "Technology Boom",
    description: "Simulates accelerated growth in technology sector",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: 1.5 },
      { parameterId: "unemployment-rate", changeType: "absolute", changeValue: -1.0 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: -20 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: 25 },
      { parameterId: "asset-growth-multiplier", changeType: "absolute", changeValue: 0.5 },
      { parameterId: "current-assets", changeType: "percentage", changeValue: 15 },
      { parameterId: "cash-flow-projection", changeType: "percentage", changeValue: 20 },
    ],
  },
  {
    id: "energy-crisis",
    name: "Energy Crisis",
    description: "Simulates impact of severe energy supply constraints",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "inflation-rate", changeType: "absolute", changeValue: 4.0 },
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: -2.0 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 90 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: -15 },
      { parameterId: "current-liabilities", changeType: "percentage", changeValue: 12 },
      { parameterId: "cash-flow-projection", changeType: "percentage", changeValue: -18 },
    ],
  },
  {
    id: "stagflation",
    name: "Stagflation Scenario",
    description: "Simulates high inflation combined with slow economic growth and high unemployment",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: -1.8 },
      { parameterId: "inflation-rate", changeType: "absolute", changeValue: 6.0 },
      { parameterId: "unemployment-rate", changeType: "absolute", changeValue: 3.0 },
      { parameterId: "interest-rate", changeType: "absolute", changeValue: 3.5 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: -20 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 60 },
      { parameterId: "money-supply-growth", changeType: "absolute", changeValue: 5.0 },
    ],
  },
  {
    id: "sovereign-debt-crisis",
    name: "Sovereign Debt Crisis",
    description: "Simulates impact of government debt defaults and fiscal instability",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "interest-rate", changeType: "absolute", changeValue: 4.0 },
      { parameterId: "risk-free-rate", changeType: "absolute", changeValue: 2.5 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 110 },
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: -2.2 },
      { parameterId: "default-correlation", changeType: "absolute", changeValue: 0.25 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: -25 },
    ],
  },
  {
    id: "currency-crisis",
    name: "Currency Crisis",
    description: "Simulates rapid devaluation of domestic currency",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "inflation-rate", changeType: "absolute", changeValue: 8.0 },
      { parameterId: "interest-rate", changeType: "absolute", changeValue: 5.0 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 100 },
      { parameterId: "current-assets", changeType: "percentage", changeValue: -15 },
      { parameterId: "current-liabilities", changeType: "percentage", changeValue: 20 },
      { parameterId: "cash-flow-projection", changeType: "percentage", changeValue: -30 },
    ],
  },
  {
    id: "economic-boom",
    name: "Economic Boom",
    description: "Simulates period of strong economic growth across sectors",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: 2.5 },
      { parameterId: "unemployment-rate", changeType: "absolute", changeValue: -2.0 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: 30 },
      { parameterId: "current-assets", changeType: "percentage", changeValue: 20 },
      { parameterId: "asset-growth-multiplier", changeType: "absolute", changeValue: 0.7 },
      { parameterId: "cash-flow-projection", changeType: "percentage", changeValue: 25 },
      { parameterId: "labor-force-participation", changeType: "absolute", changeValue: 1.5 },
    ],
  },
  {
    id: "climate-transition",
    name: "Climate Transition",
    description: "Simulates economic impact of rapid transition to low-carbon economy",
    severity: 100, // Full severity
    parameterChanges: [
      { parameterId: "base-growth-rate", changeType: "absolute", changeValue: -0.8 },
      { parameterId: "market-volatility", changeType: "percentage", changeValue: 40 },
      { parameterId: "corporate-earnings", changeType: "percentage", changeValue: -10 },
      { parameterId: "asset-growth-multiplier", changeType: "absolute", changeValue: -0.3 },
      { parameterId: "current-assets", changeType: "percentage", changeValue: -5 },
      { parameterId: "current-liabilities", changeType: "percentage", changeValue: 8 },
    ],
  },
]

export function SensitivityAnalysisDashboard() {
  const { toast } = useToast()
  const {
    modelGroups,
    getModelById,
    getExecutionSequence,
    runAllModels,
    isSimulationRunning,
    isSimulationPaused,
    resetOutputs,
    toggleModelFrozen,
    isModelFrozen,
    getRunState,
  } = useModelState()

  // State for sensitivity parameters
  const [parameters, setParameters] = useState<any[]>([])
  const [outputMetrics, setOutputMetrics] = useState<any[]>([])
  const [parameterThresholds, setParameterThresholds] = useState<ParameterThreshold[]>([])
  const [outputThresholds, setOutputThresholds] = useState<OutputMetricThreshold[]>([])
  const [activeTab, setActiveTab] = useState("parameters")
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  // Removed severity slider state
  const [customScenario, setCustomScenario] = useState<SensitivityScenario | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [approximationEnabled, setApproximationEnabled] = useState(true)
  const [runningAnalysis, setRunningAnalysis] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any | null>(null)
  const [impactedModels, setImpactedModels] = useState<string[]>([])
  const [comparisonMode, setComparisonMode] = useState<"side-by-side" | "overlay" | "difference">("side-by-side")
  const [ignoreParameterThresholds, setIgnoreParameterThresholds] = useState(false)
  const [ignoreOutputThresholds, setIgnoreOutputThresholds] = useState(false)
  const [savedThresholds, setSavedThresholds] = useState<{
    parameters: ParameterThreshold[]
    outputs: OutputMetricThreshold[]
  } | null>(null)
  // After other state variables
  const [modelRunOptions, setModelRunOptions] = useState<{ [modelId: string]: "rerun" | "preserve" }>({})
  const [applyingChanges, setApplyingChanges] = useState(false)
  const [originalAnalysisResults, setOriginalAnalysisResults] = useState<any | null>(null)
  const [resultsReady, setResultsReady] = useState(false)

  // Initialize parameters from model groups
  useEffect(() => {
    // Extract parameters from model groups
    const extractedParams: any[] = []
    const extractedMetrics: any[] = []
    const paramThresholds: ParameterThreshold[] = []
    const outThresholds: OutputMetricThreshold[] = []

    modelGroups.forEach((model) => {
      // Extract parameters
      if (model.parameters) {
        model.parameters.forEach((param: any) => {
          extractedParams.push({
            ...param,
            modelId: model.id,
            modelName: model.name,
            originalValue: param.value, // Store original value for change tracking
          })

          // Create default threshold
          const defaultThreshold = DEFAULT_PARAMETER_THRESHOLDS[param.id]
          paramThresholds.push({
            id: param.id,
            name: param.name,
            absoluteThreshold: defaultThreshold?.absoluteThreshold || param.step * 10 || 1,
            percentageThreshold: defaultThreshold?.percentageThreshold || 5,
            useAbsolute: defaultThreshold?.useAbsolute !== undefined ? defaultThreshold.useAbsolute : true,
            unit: param.unit || "",
          })
        })
      }

      // Extract output metrics
      if (model.outputs) {
        model.outputs.forEach((output: any) => {
          extractedMetrics.push({
            ...output,
            modelId: model.id,
            modelName: model.name,
          })

          // Create default threshold
          const numericValue = Number.parseFloat(output.value)
          const defaultThreshold = DEFAULT_OUTPUT_THRESHOLDS[model.id]
          outThresholds.push({
            id: output.id || `${model.id}-${output.name}`,
            metricName: output.name,
            modelId: model.id,
            modelName: model.name,
            absoluteThreshold: !isNaN(numericValue) ? numericValue * 0.1 : 1,
            percentageThreshold: defaultThreshold?.percentageThreshold || 10,
            useAbsolute: defaultThreshold?.useAbsolute !== undefined ? defaultThreshold.useAbsolute : false,
            unit: output.unit || "",
          })
        })
      }
    })

    // If no parameters found, use this expanded set
    if (extractedParams.length === 0) {
      const defaultParams = [
        {
          id: "base-growth-rate",
          name: "Base Growth Rate",
          value: 2.5,
          originalValue: 2.5, // Store original value
          min: -5,
          max: 10,
          step: 0.1,
          unit: "%",
          moduleGroup: "Economic Models",
          frozen: false,
          modelId: "economic-models",
          modelName: "Economic Models",
          impact: "high",
          indirectImpact: "very-high",
          totalModelsAffected: 15,
          primaryArea: "Economic",
        },
        {
          id: "interest-rate",
          name: "Interest Rate",
          value: 4.5,
          originalValue: 4.5, // Store original value
          min: 0,
          max: 20,
          step: 0.25,
          unit: "%",
          moduleGroup: "Financial Models",
          frozen: false,
          modelId: "financial-models",
          modelName: "Financial Models",
          impact: "very-high",
          indirectImpact: "high",
          totalModelsAffected: 12,
          primaryArea: "Cross-cutting",
        },
        {
          id: "current-assets",
          name: "Current Assets",
          value: 1250000,
          originalValue: 1250000,
          min: 0,
          max: 10000000,
          step: 10000,
          unit: "$",
          moduleGroup: "Balance Sheet Models",
          frozen: false,
          modelId: "balance-sheet-models",
          modelName: "Balance Sheet Models",
          impact: "very-high",
          indirectImpact: "high",
          totalModelsAffected: 10,
          primaryArea: "Balance Sheet",
        },
        {
          id: "money-supply-growth",
          name: "Money Supply Growth",
          value: 3.8,
          originalValue: 3.8,
          min: -2,
          max: 15,
          step: 0.1,
          unit: "%",
          moduleGroup: "Economic Models",
          frozen: false,
          modelId: "economic-models",
          modelName: "Economic Models",
          impact: "medium",
          indirectImpact: "high",
          totalModelsAffected: 10,
          primaryArea: "Economic",
        },
        {
          id: "current-liabilities",
          name: "Current Liabilities",
          value: 850000,
          originalValue: 850000,
          min: 0,
          max: 5000000,
          step: 10000,
          unit: "$",
          moduleGroup: "Balance Sheet Models",
          frozen: false,
          modelId: "balance-sheet-models",
          modelName: "Balance Sheet Models",
          impact: "high",
          indirectImpact: "medium",
          totalModelsAffected: 8,
          primaryArea: "Balance Sheet",
        },
        {
          id: "labor-force-participation",
          name: "Labor Force Participation",
          value: 62.4,
          originalValue: 62.4,
          min: 55,
          max: 75,
          step: 0.1,
          unit: "%",
          moduleGroup: "Economic Models",
          frozen: false,
          modelId: "economic-models",
          modelName: "Economic Models",
          impact: "medium",
          indirectImpact: "medium",
          totalModelsAffected: 8,
          primaryArea: "Economic",
        },
        {
          id: "corporate-earnings",
          name: "Corporate Earnings",
          value: 780000,
          originalValue: 780000,
          min: 0,
          max: 5000000,
          step: 10000,
          unit: "$",
          moduleGroup: "Market Models",
          frozen: false,
          modelId: "market-models",
          modelName: "Market Models",
          impact: "high",
          indirectImpact: "medium",
          totalModelsAffected: 7,
          primaryArea: "Market",
        },
        {
          id: "asset-growth-multiplier",
          name: "Asset Growth Multiplier",
          value: 1.5,
          originalValue: 1.5,
          min: 0.5,
          max: 5,
          step: 0.1,
          unit: "x",
          moduleGroup: "Balance Sheet Models",
          frozen: false,
          modelId: "balance-sheet-models",
          modelName: "Balance Sheet Models",
          impact: "high",
          indirectImpact: "medium",
          totalModelsAffected: 7,
          primaryArea: "Balance Sheet",
        },
        {
          id: "default-correlation",
          name: "Default Correlation",
          value: 0.35,
          originalValue: 0.35,
          min: 0,
          max: 1,
          step: 0.01,
          unit: "",
          moduleGroup: "Risk Models",
          frozen: false,
          modelId: "risk-models",
          modelName: "Risk Models",
          impact: "high",
          indirectImpact: "low",
          totalModelsAffected: 5,
          primaryArea: "Risk",
        },
        {
          id: "cash-flow-projection",
          name: "Cash Flow Projection",
          value: 420000,
          originalValue: 420000,
          min: -1000000,
          max: 2000000,
          step: 10000,
          unit: "$",
          moduleGroup: "Balance Sheet Models",
          frozen: false,
          modelId: "balance-sheet-models",
          modelName: "Balance Sheet Models",
          impact: "medium",
          indirectImpact: "medium",
          totalModelsAffected: 5,
          primaryArea: "Balance Sheet",
        },
        {
          id: "risk-free-rate",
          name: "Risk-Free Rate",
          value: 2.8,
          originalValue: 2.8,
          min: 0,
          max: 10,
          step: 0.1,
          unit: "%",
          moduleGroup: "Financial Models",
          frozen: false,
          modelId: "financial-models",
          modelName: "Financial Models",
          impact: "medium",
          indirectImpact: "low",
          totalModelsAffected: 4,
          primaryArea: "Financial",
        },
        {
          id: "inflation-rate",
          name: "Inflation Rate",
          value: 3.2,
          originalValue: 3.2,
          min: 0,
          max: 15,
          step: 0.1,
          unit: "%",
          moduleGroup: "Economic Models",
          frozen: false,
          modelId: "economic-models",
          modelName: "Economic Models",
          impact: "high",
          indirectImpact: "high",
          totalModelsAffected: 9,
          primaryArea: "Economic",
        },
        {
          id: "unemployment-rate",
          name: "Unemployment Rate",
          value: 5.8,
          originalValue: 5.8,
          min: 0,
          max: 25,
          step: 0.1,
          unit: "%",
          moduleGroup: "Economic Models",
          frozen: false,
          modelId: "economic-models",
          modelName: "Economic Models",
          impact: "medium",
          indirectImpact: "high",
          totalModelsAffected: 8,
          primaryArea: "Economic",
        },
        {
          id: "market-volatility",
          name: "Market Volatility",
          value: 15,
          originalValue: 15,
          min: 0,
          max: 100,
          step: 1,
          unit: "%",
          moduleGroup: "Risk Assessment",
          frozen: false,
          modelId: "risk-models",
          modelName: "Risk Models",
          impact: "high",
          indirectImpact: "medium",
          totalModelsAffected: 6,
          primaryArea: "Risk",
        },
      ]

      setParameters(defaultParams)

      // Create default thresholds for default parameters
      defaultParams.forEach((param) => {
        const defaultThreshold = DEFAULT_PARAMETER_THRESHOLDS[param.id]
        paramThresholds.push({
          id: param.id,
          name: param.name,
          absoluteThreshold: defaultThreshold?.absoluteThreshold || param.step * 10 || 1,
          percentageThreshold: defaultThreshold?.percentageThreshold || 5,
          useAbsolute: defaultThreshold?.useAbsolute !== undefined ? defaultThreshold.useAbsolute : true,
          unit: param.unit || "",
        })
      })
    } else {
      setParameters(extractedParams)
      setOutputMetrics(extractedMetrics)
    }

    setParameterThresholds(paramThresholds)
    setOutputThresholds(outThresholds)
  }, [modelGroups])

  // Add this function to handle parameter changes after a run
  // Find the handleParameterChange function and replace it with this version:
  const handleParameterChange = (id: string, value: number) => {
    // Log the change with more details
    console.log(`handleParameterChange: ${id} = ${value} (after run: ${getRunState() !== "IDLE"})`)

    setParameters((prevParams) =>
      prevParams.map((param) => {
        if (param.id === id) {
          const originalValue = param.originalValue !== undefined ? param.originalValue : param.value
          const changedAmount = value - originalValue
          const changed = Math.abs(changedAmount) > 0.0001

          // Create a new parameter object with the updated value
          return {
            ...param,
            value,
            changed,
            changedAmount,
            // Mark this as explicitly changed by the user after a run
            userChangedAfterRun: getRunState() !== "IDLE",
          }
        }
        return param
      }),
    )

    // Update impacted models based on parameter change
    updateImpactedModels(id, value)
  }

  // Update the list of models impacted by parameter changes
  const updateImpactedModels = (parameterId: string, newValue: number) => {
    // Find the parameter
    const param = parameters.find((p) => p.id === parameterId)
    if (!param) return

    // Find models that depend on this parameter
    const directlyImpactedModelId = param.modelId
    const directlyImpactedModel = getModelById(directlyImpactedModelId)

    if (!directlyImpactedModel) return

    // Get all models that depend on the directly impacted model
    const dependentModels: string[] = []
    const addDependents = (modelId: string) => {
      modelGroups.forEach((model) => {
        if (model.dependencies && model.dependencies.includes(modelId) && !dependentModels.includes(model.id)) {
          dependentModels.push(model.id)
          addDependents(model.id)
        }
      })
    }

    // Start with the directly impacted model
    dependentModels.push(directlyImpactedModelId)
    addDependents(directlyImpactedModelId)

    setImpactedModels(dependentModels)
  }

  // Handle threshold change
  const handleParameterThresholdChange = (id: string, field: string, value: number | boolean) => {
    setParameterThresholds((prevThresholds) =>
      prevThresholds.map((threshold) => (threshold.id === id ? { ...threshold, [field]: value } : threshold)),
    )
  }

  const handleOutputThresholdChange = (id: string, field: string, value: number | boolean) => {
    setOutputThresholds((prevThresholds) =>
      prevThresholds.map((threshold) => (threshold.id === id ? { ...threshold, [field]: value } : threshold)),
    )
  }

  // Handle scenario selection
  const handleScenarioSelect = (scenarioId: string) => {
    // Add this at the beginning of handleScenarioSelect function
    console.log("handleScenarioSelect called with scenario:", scenarioId)

    setSelectedScenario(scenarioId)
    const scenario = predefinedScenarios.find((s) => s.id === scenarioId)

    if (scenario) {
      // Apply scenario changes with proper change tracking
      setParameters((prevParams) =>
        prevParams.map((param) => {
          const change = scenario.parameterChanges.find((c) => c.parameterId === param.id)
          if (change) {
            const originalValue = param.originalValue !== undefined ? param.originalValue : param.value
            let newValue
            let changedAmount

            if (change.changeType === "absolute") {
              newValue = originalValue + change.changeValue
              changedAmount = change.changeValue
            } else {
              // Percentage change
              newValue = originalValue * (1 + change.changeValue / 100)
              changedAmount = newValue - originalValue
            }

            // Ensure value is within bounds
            if (param.min !== undefined && newValue < param.min) {
              newValue = param.min
              changedAmount = newValue - originalValue
            }
            if (param.max !== undefined && newValue > param.max) {
              newValue = param.max
              changedAmount = newValue - originalValue
            }

            return {
              ...param,
              value: newValue,
              changed: true,
              changedAmount,
            }
          }
          return param
        }),
      )

      // Update impacted models
      const impactedIds: string[] = []
      scenario.parameterChanges.forEach((change) => {
        const param = parameters.find((p) => p.id === change.parameterId)
        if (param && param.modelId && !impactedIds.includes(param.modelId)) {
          impactedIds.push(param.modelId)
        }
      })

      // Get dependent models
      const allImpacted: string[] = [...impactedIds]
      impactedIds.forEach((modelId) => {
        const addDependents = (id: string) => {
          modelGroups.forEach((model) => {
            if (model.dependencies && model.dependencies.includes(id) && !allImpacted.includes(model.id)) {
              allImpacted.push(model.id)
              addDependents(model.id)
            }
          })
        }
        addDependents(modelId)
      })

      setImpactedModels(allImpacted)
    }
  }

  // Removed handleSeverityChange function

  // FIXED: Run sensitivity analysis to properly check thresholds
  const runSensitivityAnalysis = () => {
    // Add this at the beginning of runSensitivityAnalysis function
    console.log("runSensitivityAnalysis called with parameters:", parameters)

    console.log(
      "STARTING ANALYSIS - Current parameters:",
      parameters.map((p) => ({ id: p.id, value: p.value, originalValue: p.originalValue, changed: p.changed })),
    )

    setRunningAnalysis(true)

    // Simulate analysis running
    setTimeout(() => {
      // Generate mock results
      const results = {
        originalValues: {},
        newValues: {},
        changes: {},
        impactedModels: impactedModels,
        approximatedModels: [],
        rerunModels: [],
        thresholdExceeded: false,
        thresholdsIgnored: ignoreParameterThresholds || ignoreOutputThresholds,
      }

      // Create a mapping of model IDs to their parameter changes
      const modelParameterChanges = {}

      // Track which parameters were changed for each model
      parameters.forEach((param) => {
        if (param.changed) {
          if (!modelParameterChanges[param.modelId]) {
            modelParameterChanges[param.modelId] = []
          }

          // Use the tracked changedAmount
          const originalValue =
            param.originalValue !== undefined ? param.originalValue : param.value - (param.changedAmount || 0)

          modelParameterChanges[param.modelId].push({
            id: param.id,
            name: param.name,
            oldValue: originalValue,
            newValue: param.value,
            percentChange: ((param.changedAmount || 0) / (originalValue || 1)) * 100,
            absoluteChange: param.changedAmount || 0,
          })

          // Check parameter thresholds
          if (!ignoreParameterThresholds) {
            const threshold = parameterThresholds.find((t) => t.id === param.id)
            if (threshold) {
              const absoluteChange = Math.abs(param.changedAmount || 0)
              const percentChange = Math.abs(((param.changedAmount || 0) / (originalValue || 1)) * 100)

              const thresholdExceeded = threshold.useAbsolute
                ? absoluteChange > threshold.absoluteThreshold
                : percentChange > threshold.percentageThreshold

              if (thresholdExceeded) {
                console.log(
                  `Parameter threshold exceeded for ${param.name}: ${threshold.useAbsolute ? absoluteChange.toFixed(2) : percentChange.toFixed(2)}% > ${threshold.useAbsolute ? threshold.absoluteThreshold : threshold.percentageThreshold}%`,
                )
                results.thresholdExceeded = true
                if (!results.rerunModels.includes(param.modelId)) {
                  results.rerunModels.push(param.modelId)
                }
              }
            }
          }
        }
      })

      // For each output metric, generate a simulated change
      outputMetrics.forEach((metric) => {
        const originalValue = Number.parseFloat(metric.value)
        if (isNaN(originalValue)) return

        // Check if this metric's model is impacted
        const isImpacted = impactedModels.includes(metric.modelId)

        if (isImpacted) {
          // Generate a change based on whether the model is directly or indirectly impacted
          const directlyImpacted = parameters.some((p) => p.changed && p.modelId === metric.modelId)

          // Calculate the total parameter change magnitude for this model
          const modelParamChanges = parameters
            .filter((p) => p.changed && p.modelId === metric.modelId)
            .map((p) => {
              const paramThreshold = parameterThresholds.find((t) => t.id === p.id)
              if (paramThreshold?.useAbsolute) {
                // For absolute changes, normalize by the threshold
                return Math.abs(p.changedAmount || 0) / (paramThreshold.absoluteThreshold || 1)
              } else {
                // For percentage changes, use the percentage directly
                const originalValue = p.originalValue !== undefined ? p.originalValue : p.value - (p.changedAmount || 0)
                return Math.abs((p.changedAmount || 0) / (originalValue || 1)) * 100
              }
            })

          // Calculate average parameter change magnitude
          const avgParamChangeMagnitude =
            modelParamChanges.length > 0
              ? modelParamChanges.reduce((sum, val) => sum + val, 0) / modelParamChanges.length
              : 0

          // Determine change factor based on the scenario and parameter changes
          let changeFactor
          let baseChangeFactor = 0

          // Base the change factor on the parameter change magnitude
          if (directlyImpacted) {
            baseChangeFactor = Math.min(avgParamChangeMagnitude * 0.5, 0.5) // Cap at 50%
          } else {
            // Indirect impacts are smaller but still significant
            baseChangeFactor = Math.min(avgParamChangeMagnitude * 0.25, 0.3) // Cap at 30%
          }

          // Apply scenario-specific modifiers
          if (selectedScenario === "trade-war") {
            // For trade war scenario, create specific impacts based on metric type
            if (metric.name.toLowerCase().includes("growth") || metric.name.toLowerCase().includes("gdp")) {
              changeFactor = -baseChangeFactor * 2.5 // Stronger negative impact on growth
            } else if (metric.name.toLowerCase().includes("inflation") || metric.name.toLowerCase().includes("price")) {
              changeFactor = baseChangeFactor * 3.0 // Stronger increased inflation
            } else if (metric.name.toLowerCase().includes("export") || metric.name.toLowerCase().includes("trade")) {
              changeFactor = -baseChangeFactor * 4.0 // Very significant negative impact on trade
            } else if (metric.name.toLowerCase().includes("volatility") || metric.name.toLowerCase().includes("risk")) {
              changeFactor = baseChangeFactor * 3.5 // Stronger increased volatility and risk
            } else if (metric.modelId.includes("market")) {
              changeFactor = -baseChangeFactor * 2.0 // Negative impact on market metrics
            } else if (metric.modelId.includes("financial")) {
              changeFactor = -baseChangeFactor * 1.8 // Negative impact on financial metrics
            } else if (metric.modelId.includes("economic")) {
              changeFactor = -baseChangeFactor * 2.2 // Negative impact on economic metrics
            } else if (directlyImpacted) {
              // Add some controlled randomness for other directly impacted metrics
              const randomFactor = 0.8 + Math.sin(metric.name.length * 3.14159) * 0.4 // Deterministic "random" factor
              changeFactor = -baseChangeFactor * randomFactor // Mostly negative for trade war
            } else {
              // For indirectly impacted metrics
              const randomFactor = 0.7 + Math.cos(metric.name.length * 2.71828) * 0.3 // Different deterministic "random" factor
              changeFactor = -baseChangeFactor * randomFactor * 0.7 // Smaller impact, mostly negative
            }

            // Ensure the change is significant enough to potentially exceed thresholds
            if (Math.abs(changeFactor) < 0.08) {
              changeFactor = changeFactor < 0 ? -0.08 : 0.08 // Minimum 8% change for trade war
            }
          } else if (selectedScenario === "financial-crisis-2008") {
            // Special handling for financial crisis scenario
            if (metric.name.toLowerCase().includes("growth") || metric.name.toLowerCase().includes("gdp")) {
              changeFactor = -baseChangeFactor * 3.0 // Severe negative impact on growth
            } else if (metric.name.toLowerCase().includes("unemployment")) {
              changeFactor = baseChangeFactor * 4.0 // Severe increase in unemployment
            } else if (metric.name.toLowerCase().includes("volatility") || metric.name.toLowerCase().includes("risk")) {
              changeFactor = baseChangeFactor * 5.0 // Extreme increase in volatility/risk
            } else if (metric.modelId.includes("market")) {
              changeFactor = -baseChangeFactor * 3.5 // Severe negative impact on market metrics
            } else if (metric.modelId.includes("financial")) {
              changeFactor = -baseChangeFactor * 4.0 // Severe negative impact on financial metrics
            } else if (metric.modelId.includes("economic")) {
              changeFactor = -baseChangeFactor * 3.0 // Severe negative impact on economic metrics
            } else if (directlyImpacted) {
              const randomFactor = 0.9 + Math.sin(metric.name.length * 2.5) * 0.3
              changeFactor = -baseChangeFactor * randomFactor * 3.0 // Mostly negative, amplified
            } else {
              const randomFactor = 0.8 + Math.cos(metric.name.length * 1.8) * 0.3
              changeFactor = -baseChangeFactor * randomFactor * 2.0 // Smaller but still significant
            }

            // Ensure significant changes for financial crisis
            if (Math.abs(changeFactor) < 0.15) {
              changeFactor = changeFactor < 0 ? -0.15 : 0.15 // Minimum 15% change for financial crisis
            }
          } else {
            // Default change factor logic for other scenarios - more balanced positive/negative
            if (directlyImpacted) {
              // Use a deterministic approach instead of random
              const direction = metric.name.length % 2 === 0 ? 1 : -1
              const variationFactor = 0.8 + Math.sin(metric.name.length * 2.5) * 0.4
              changeFactor = baseChangeFactor * direction * variationFactor
            } else {
              // Smaller impact for indirectly impacted metrics
              const direction = metric.name.length % 3 === 0 ? 1 : -1
              const variationFactor = 0.7 + Math.cos(metric.name.length * 1.8) * 0.3
              changeFactor = baseChangeFactor * direction * variationFactor * 0.6
            }
          }

          // Apply the change factor to get the new value
          const newValue = originalValue * (1 + changeFactor)
          const absoluteChange = newValue - originalValue
          const percentageChange = (absoluteChange / originalValue) * 100

          let thresholdExceeded = false
          const threshold = outputThresholds.find((t) => t.id === metric.id)

          // Check if threshold is exceeded (unless thresholds are being ignored)
          if (threshold && !ignoreOutputThresholds) {
            if (threshold.useAbsolute) {
              thresholdExceeded = Math.abs(absoluteChange) > threshold.absoluteThreshold
            } else {
              thresholdExceeded = Math.abs(percentageChange) > threshold.percentageThreshold
            }

            // Log threshold check
            if (thresholdExceeded) {
              console.log(
                `Output threshold exceeded for ${metric.name}: ${threshold.useAbsolute ? Math.abs(absoluteChange).toFixed(2) : Math.abs(percentageChange).toFixed(2)}% > ${threshold.useAbsolute ? threshold.absoluteThreshold : threshold.percentageThreshold}%`,
              )
            }
          }

          // Store results
          results.originalValues[metric.id] = originalValue
          results.newValues[metric.id] = newValue
          results.changes[metric.id] = {
            absolute: absoluteChange,
            percentage: percentageChange,
            thresholdExceeded,
          }

          // Update overall threshold exceeded flag
          if (thresholdExceeded) {
            results.thresholdExceeded = true
          }

          // Determine if model should be approximated or rerun
          if (thresholdExceeded) {
            if (!results.rerunModels.includes(metric.modelId)) {
              results.rerunModels.push(metric.modelId)
            }
          } else if (approximationEnabled) {
            if (!results.approximatedModels.includes(metric.modelId) && !results.rerunModels.includes(metric.modelId)) {
              results.approximatedModels.push(metric.modelId)
            }
          } else {
            if (!results.rerunModels.includes(metric.modelId)) {
              results.rerunModels.push(metric.modelId)
            }
          }
        }
      })

      // If no changes were generated but we have impacted models, create synthetic changes
      if (Object.keys(results.changes).length === 0 && impactedModels.length > 0) {
        // Create synthetic output metrics for each impacted model
        impactedModels.forEach((modelId, index) => {
          const model = getModelById(modelId)
          if (!model) return

          // Create 2-3 synthetic metrics per model
          const metricCount = 2 + Math.floor(Math.random() * 2)
          for (let i = 0; i < metricCount; i++) {
            const metricId = `synthetic-${modelId}-${i}`
            const metricName = getSyntheticMetricName(modelId, i)

            // Generate a baseline value
            const baseValue = 100 + Math.random() * 900

            // Generate a change factor based on the scenario
            let changeFactor
            if (selectedScenario === "trade-war") {
              // More negative changes for trade war
              changeFactor = (Math.random() * 0.25 + 0.05) * (Math.random() > 0.7 ? 1 : -1)
            } else if (selectedScenario === "financial-crisis-2008") {
              // More extreme negative changes for financial crisis
              changeFactor = (Math.random() * 0.4 + 0.15) * (Math.random() > 0.8 ? 1 : -1)
            } else {
              changeFactor = (Math.random() * 0.2 + 0.05) * (Math.random() > 0.5 ? 1 : -1)
            }

            const newValue = baseValue * (1 + changeFactor)
            const absoluteChange = newValue - baseValue
            const percentageChange = (absoluteChange / baseValue) * 100

            // Check if this synthetic change exceeds thresholds
            let thresholdExceeded = false
            if (!ignoreOutputThresholds) {
              const defaultThreshold = DEFAULT_OUTPUT_THRESHOLDS[modelId]
              if (defaultThreshold) {
                thresholdExceeded = defaultThreshold.useAbsolute
                  ? Math.abs(absoluteChange) > defaultThreshold.absoluteThreshold
                  : Math.abs(percentageChange) > defaultThreshold.percentageThreshold
              } else {
                // Default threshold check if no specific threshold exists
                thresholdExceeded = Math.abs(percentageChange) > 15 // 15% as a default threshold
              }
            }

            // Store the synthetic metric
            results.originalValues[metricId] = baseValue
            results.newValues[metricId] = newValue
            results.changes[metricId] = {
              absolute: absoluteChange,
              percentage: percentageChange,
              thresholdExceeded: thresholdExceeded,
              synthetic: true,
            }

            // Update overall threshold exceeded flag
            if (thresholdExceeded) {
              results.thresholdExceeded = true
            }

            // Add to output metrics for display
            outputMetrics.push({
              id: metricId,
              name: metricName,
              modelId: modelId,
              modelName: model.name || modelId,
              value: baseValue.toFixed(2),
              unit: getMetricUnit(metricName),
              synthetic: true,
            })
          }

          // Add this model to approximated models if not already there
          if (!results.approximatedModels.includes(modelId) && !results.rerunModels.includes(modelId)) {
            if (approximationEnabled) {
              results.approximatedModels.push(modelId)
            } else {
              results.rerunModels.push(modelId)
            }
          }
        })
      }

      // Remove duplicates from rerun and approximated models
      results.rerunModels = [...new Set(results.rerunModels)]
      results.approximatedModels = [...new Set(results.approximatedModels)]

      // If we're ignoring all thresholds, we still need to categorize models
      if (ignoreParameterThresholds && ignoreOutputThresholds) {
        results.thresholdExceeded = false

        // When thresholds are ignored, we should still categorize models based on approximation setting
        if (approximationEnabled) {
          // Move all models to approximatedModels if approximation is enabled
          const allImpactedModels = [
            ...new Set([...results.approximatedModels, ...results.rerunModels, ...impactedModels]),
          ]
          results.approximatedModels = allImpactedModels
          results.rerunModels = []
        } else {
          // If approximation is disabled, all models should be rerun
          const allImpactedModels = [
            ...new Set([...results.approximatedModels, ...results.rerunModels, ...impactedModels]),
          ]
          results.rerunModels = allImpactedModels
          results.approximatedModels = []
        }
      }

      // Store current parameter values with the results to prevent them from being lost
      setAnalysisResults({
        ...results,
        // Store the current parameter state to prevent loss after analysis
        parameterState: parameters.map((p) => ({ ...p })),
      })
      setRunningAnalysis(false)

      console.log(
        "ANALYSIS COMPLETE - Parameters at completion:",
        parameters.map((p) => ({ id: p.id, value: p.value, originalValue: p.originalValue, changed: p.changed })),
      )

      toast({
        title: "Sensitivity Analysis Complete",
        description: results.thresholdExceeded
          ? "Thresholds exceeded. Some models require full recalculation."
          : ignoreParameterThresholds || ignoreOutputThresholds
            ? "Analysis complete. Threshold checks were ignored."
            : "Analysis complete. All changes within thresholds.",
      })
    }, 2000)
  }

  // Helper function to generate synthetic metric names
  function getSyntheticMetricName(modelId, index) {
    const economicMetrics = ["GDP Growth", "Inflation Rate", "Consumer Spending", "Business Investment"]
    const financialMetrics = ["Interest Income", "Net Profit Margin", "Return on Assets", "Debt-to-Equity Ratio"]
    const riskMetrics = ["Default Rate", "Risk Exposure", "Value at Risk", "Expected Loss"]
    const marketMetrics = ["Market Share", "Revenue Growth", "Competitive Index", "Price Elasticity"]
    const balanceSheetMetrics = ["Asset Turnover", "Working Capital", "Cash Ratio", "Inventory Turnover"]

    if (modelId.includes("economic")) {
      return economicMetrics[index % economicMetrics.length]
    } else if (modelId.includes("financial")) {
      return financialMetrics[index % financialMetrics.length]
    } else if (modelId.includes("risk")) {
      return riskMetrics[index % riskMetrics.length]
    } else if (modelId.includes("market")) {
      return marketMetrics[index % marketMetrics.length]
    } else if (modelId.includes("balance")) {
      return balanceSheetMetrics[index % balanceSheetMetrics.length]
    } else {
      const allMetrics = [
        ...economicMetrics,
        ...financialMetrics,
        ...riskMetrics,
        ...marketMetrics,
        ...balanceSheetMetrics,
      ]
      return allMetrics[Math.floor(Math.random() * allMetrics.length)]
    }
  }

  // Helper function to get appropriate unit for a metric
  function getMetricUnit(metricName) {
    if (
      metricName.toLowerCase().includes("rate") ||
      metricName.toLowerCase().includes("growth") ||
      metricName.toLowerCase().includes("margin") ||
      metricName.toLowerCase().includes("ratio")
    ) {
      return "%"
    } else if (
      metricName.toLowerCase().includes("revenue") ||
      metricName.toLowerCase().includes("capital") ||
      metricName.toLowerCase().includes("asset") ||
      metricName.toLowerCase().includes("value")
    ) {
      return "$"
    } else {
      return ""
    }
  }

  // Generate chart data for sensitivity impact visualization
  const generateImpactChartData = () => {
    if (!analysisResults) return []

    // Create a simpler data structure that works better with the chart
    const data = []

    // Get metrics with changes, regardless of threshold status
    const metricsWithChanges = Object.keys(analysisResults.changes)
      .map((metricId) => {
        // Find the metric in outputMetrics
        const metric = outputMetrics.find((m) => m.id === metricId)
        if (!metric) {
          // Handle synthetic metrics that might not be in the original outputMetrics
          return {
            id: metricId,
            name: metricId.replace("synthetic-", "").replace(/-\d+$/, ""),
            model: metricId.split("-")[1] || "Unknown",
            change: analysisResults.changes[metricId].percentage,
          }
        }

        return {
          id: metricId,
          name: metric.name,
          model: metric.modelName,
          change: analysisResults.changes[metric.id].percentage,
          synthetic: metric.synthetic,
        }
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 10) // Take top 10 metrics with biggest changes

    // Add to data array in the format expected by the chart
    metricsWithChanges.forEach((metric) => {
      data.push({
        name: `${metric.name} (${metric.model})`,
        value: metric.change,
      })
    })

    return data
  }

  // Get icon for scenario
  const getScenarioIcon = (scenarioId: string) => {
    switch (scenarioId) {
      case "financial-crisis-2008":
        return <Briefcase className="h-4 w-4 mr-2" />
      case "trade-war":
        return <Globe className="h-4 w-4 mr-2" />
      case "pandemic":
        return <Virus className="h-4 w-4 mr-2" />
      case "tech-boom":
        return <Zap className="h-4 w-4 mr-2" />
      case "energy-crisis":
        return <Thermometer className="h-4 w-4 mr-2" />
      case "stagflation":
        return <TrendingDown className="h-4 w-4 mr-2" />
      case "sovereign-debt-crisis":
        return <Building className="h-4 w-4 mr-2" />
      case "currency-crisis":
        return <DollarSign className="h-4 w-4 mr-2" />
      case "economic-boom":
        return <TrendingUp className="h-4 w-4 mr-2" />
      case "climate-transition":
        return <Cloud className="h-4 w-4 mr-2" />
      default:
        return <Sliders className="h-4 w-4 mr-2" />
    }
  }

  // Get severity badge color
  const getSeverityColor = (severity: number) => {
    if (severity < 30) return "bg-green-100 text-green-600"
    if (severity < 60) return "bg-yellow-100 text-yellow-600"
    return "bg-red-100 text-red-600"
  }

  // Add this function after the getSeverityColor function
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "very-high":
        return <Badge className="bg-red-100 text-red-600">Very High</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-600">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-600">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-600">Low</Badge>
      default:
        return null
    }
  }

  const saveCurrentThresholds = () => {
    setSavedThresholds({
      parameters: [...parameterThresholds],
      outputs: [...outputThresholds],
    })
    toast({
      title: "Thresholds Saved",
      description: "Current threshold settings have been saved.",
    })
  }

  const restoreSavedThresholds = () => {
    if (savedThresholds) {
      setParameterThresholds([...savedThresholds.parameters])
      setOutputThresholds([...savedThresholds.outputs])
      toast({
        title: "Thresholds Restored",
        description: "Threshold settings have been restored to the saved values.",
      })
    }
  }

  const resetToDefaultThresholds = () => {
    const defaultParamThresholds: ParameterThreshold[] = parameters.map((param) => {
      const defaultThreshold = DEFAULT_PARAMETER_THRESHOLDS[param.id]
      return {
        id: param.id,
        name: param.name,
        absoluteThreshold: defaultThreshold?.absoluteThreshold || param.step * 10 || 1,
        percentageThreshold: defaultThreshold?.percentageThreshold || 5,
        useAbsolute: defaultThreshold?.useAbsolute !== undefined ? defaultThreshold.useAbsolute : true,
        unit: param.unit || "",
      }
    })

    const defaultOutputThresholds: OutputMetricThreshold[] = outputMetrics.map((output) => {
      const numericValue = Number.parseFloat(output.value)
      const defaultThreshold = DEFAULT_OUTPUT_THRESHOLDS[output.modelId]
      return {
        id: output.id || `${output.modelId}-${output.name}`,
        metricName: output.name,
        modelId: output.modelId,
        modelName: output.modelName,
        absoluteThreshold: !isNaN(numericValue) ? numericValue * 0.1 : 1,
        percentageThreshold: defaultThreshold?.percentageThreshold || 10,
        useAbsolute: defaultThreshold?.useAbsolute !== undefined ? defaultThreshold.useAbsolute : false,
        unit: output.unit || "",
      }
    })

    setParameterThresholds(defaultParamThresholds)
    setOutputThresholds(defaultOutputThresholds)

    toast({
      title: "Thresholds Reset",
      description: "Threshold settings have been reset to default values.",
    })
  }

  // Find the toggleModelRunOption function and replace it with this improved version:

  const toggleModelRunOption = (modelId: string) => {
    console.log(
      `Toggling model ${modelId} from ${modelRunOptions[modelId]} to ${modelRunOptions[modelId] === "rerun" ? "preserve" : "rerun"}`,
    )

    // Create a new options object to ensure state update
    const newOptions = { ...modelRunOptions }
    newOptions[modelId] = newOptions[modelId] === "rerun" ? "preserve" : "rerun"

    // Update state with the new options
    setModelRunOptions(newOptions)

    // Perform a direct recalculation without the loading state
    if (originalAnalysisResults) {
      try {
        // Create a deep copy of the original results to modify
        const updatedResults = JSON.parse(JSON.stringify(originalAnalysisResults))

        // Get all models that will be preserved
        const preservedModels = Object.entries(newOptions)
          .filter(([_, option]) => option === "preserve")
          .map(([modelId]) => modelId)

        console.log("Models to preserve:", preservedModels)

        // Update metrics for preserved models to show no change
        outputMetrics.forEach((metric) => {
          if (preservedModels.includes(metric.modelId) && updatedResults.changes[metric.id]) {
            // For preserved models, set changes to zero
            updatedResults.changes[metric.id] = {
              absolute: 0,
              percentage: 0,
              thresholdExceeded: false,
              preserved: true,
            }

            // Set new value equal to original value
            updatedResults.newValues[metric.id] = updatedResults.originalValues[metric.id]
          }
        })

        // Update rerun and approximated models lists
        updatedResults.rerunModels = updatedResults.rerunModels.filter((id) => !preservedModels.includes(id))
        updatedResults.approximatedModels = updatedResults.approximatedModels.filter(
          (id) => !preservedModels.includes(id),
        )

        // Add preserved models to a new list
        updatedResults.preservedModels = preservedModels

        // Update the analysis results directly without loading state
        setAnalysisResults(updatedResults)
      } catch (error) {
        console.error("Error during toggle recalculation:", error)
        toast({
          title: "Calculation Error",
          description: "There was an error updating the results. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Find the recalculateChangesBasedOnRunOptions function and replace it with this simplified version:

  const recalculateChangesBasedOnRunOptions = () => {
    if (!originalAnalysisResults) {
      console.log("Cannot recalculate: missing original analysis results")
      setResultsReady(true) // Ensure we exit loading state even if there's an error
      return
    }

    try {
      console.log("Recalculating changes based on run options:", modelRunOptions)

      // Create a deep copy of the original results to modify
      const updatedResults = JSON.parse(JSON.stringify(originalAnalysisResults))

      // Get all models that will be preserved
      const preservedModels = Object.entries(modelRunOptions)
        .filter(([_, option]) => option === "preserve")
        .map(([modelId]) => modelId)

      console.log("Models to preserve:", preservedModels)

      // Update metrics for preserved models to show no change
      outputMetrics.forEach((metric) => {
        if (preservedModels.includes(metric.modelId) && updatedResults.changes[metric.id]) {
          // For preserved models, set changes to zero
          updatedResults.changes[metric.id] = {
            absolute: 0,
            percentage: 0,
            thresholdExceeded: false,
            preserved: true,
          }

          // Set new value equal to original value
          updatedResults.newValues[metric.id] = updatedResults.originalValues[metric.id]
        }
      })

      // Update rerun and approximated models lists
      updatedResults.rerunModels = updatedResults.rerunModels.filter((id) => !preservedModels.includes(id))
      updatedResults.approximatedModels = updatedResults.approximatedModels.filter(
        (id) => !preservedModels.includes(id),
      )

      // Add preserved models to a new list
      updatedResults.preservedModels = preservedModels

      console.log("Recalculation complete, updating analysis results")
      setAnalysisResults(updatedResults)
    } catch (error) {
      console.error("Error during recalculation:", error)
    } finally {
      // Always ensure we exit the loading state
      setResultsReady(true)
    }
  }

  // Find the useEffect that initializes run options and replace it with this version:

  // Replace the useEffect that initializes run options with this version:
  useEffect(() => {
    if (analysisResults && !originalAnalysisResults) {
      console.log("Initializing model run options based on analysis results")

      const initialRunOptions = {}

      // Set initial options based on threshold status
      const allModels = [
        ...new Set([...analysisResults.rerunModels, ...analysisResults.approximatedModels, ...impactedModels]),
      ]

      allModels.forEach((modelId) => {
        // Default to "rerun" for models that exceed thresholds or when thresholds are ignored
        // Default to "preserve" for models with changes within thresholds
        if (analysisResults.thresholdsIgnored || analysisResults.rerunModels.includes(modelId)) {
          // If thresholds are ignored or the model exceeds thresholds, default to rerun
          initialRunOptions[modelId] = "rerun"
        } else {
          // If changes are within thresholds, default to preserve
          initialRunOptions[modelId] = "preserve"
        }
      })

      // Make sure all models in the output metrics are included
      outputMetrics.forEach((metric) => {
        if (metric.modelId && !initialRunOptions[metric.modelId]) {
          initialRunOptions[metric.modelId] = "preserve"
        }
      })

      console.log("Initial model run options:", initialRunOptions)

      // Store the original analysis results for reference when recalculating
      setOriginalAnalysisResults({ ...analysisResults })

      // Update the model run options
      setModelRunOptions(initialRunOptions)

      // Set results ready
      setResultsReady(true)
    }
  }, [analysisResults, impactedModels, originalAnalysisResults, outputMetrics])

  // Add a separate useEffect to handle the initial preservation logic
  useEffect(() => {
    // Only run this effect when we have model run options and original analysis results
    // but haven't yet applied the preservation logic to the current analysis results
    if (
      Object.keys(modelRunOptions).length > 0 &&
      originalAnalysisResults &&
      analysisResults &&
      !analysisResults.preservedModels
    ) {
      const preservedModels = Object.entries(modelRunOptions)
        .filter(([_, option]) => option === "preserve")
        .map(([modelId]) => modelId)

      if (preservedModels.length > 0) {
        try {
          const updatedResults = JSON.parse(JSON.stringify(originalAnalysisResults))

          // Update metrics for preserved models to show no change
          outputMetrics.forEach((metric) => {
            if (preservedModels.includes(metric.modelId) && updatedResults.changes[metric.id]) {
              // For preserved models, set changes to zero
              updatedResults.changes[metric.id] = {
                absolute: 0,
                percentage: 0,
                thresholdExceeded: false,
                preserved: true,
              }

              // Set new value equal to original value
              updatedResults.newValues[metric.id] = updatedResults.originalValues[metric.id]
            }
          })

          // Update rerun and approximated models lists
          updatedResults.rerunModels = updatedResults.rerunModels.filter((id) => !preservedModels.includes(id))
          updatedResults.approximatedModels = updatedResults.approximatedModels.filter(
            (id) => !preservedModels.includes(id),
          )

          // Add preserved models to a new list
          updatedResults.preservedModels = preservedModels

          // Update the analysis results
          setAnalysisResults(updatedResults)
        } catch (error) {
          console.error("Error during initial preservation:", error)
        }
      }
    }
  }, [modelRunOptions, originalAnalysisResults, analysisResults, outputMetrics])

  // Add a safety timeout to ensure we never get stuck in loading state
  // Add this after the existing useEffect hooks:

  // Add this after the other useEffect hooks
  useEffect(() => {
    // When analysis results are set, ensure parameters maintain their values
    if (analysisResults && analysisResults.parameterState) {
      console.log("RESTORING PARAMETERS from analysis results")
      setParameters((prev) => {
        // Only update if the values are different to avoid infinite loops
        const needsUpdate = prev.some(
          (p, i) => analysisResults.parameterState[i] && p.value !== analysisResults.parameterState[i].value,
        )

        if (needsUpdate) {
          console.log("Parameters need restoration - updating")
          return analysisResults.parameterState
        }
        return prev
      })
    }
  }, [analysisResults])

  // Replace the parameter restoration useEffect with this improved version
  useEffect(() => {
    // When analysis results are set, ensure parameters maintain their values
    if (analysisResults && analysisResults.parameterState) {
      console.log("RESTORING PARAMETERS from analysis results")
      setParameters((prev) => {
        // Create a new array with preserved user values
        return prev.map((param, i) => {
          const storedParam = analysisResults.parameterState[i]
          if (!storedParam) return param

          // If the user manually changed this parameter after the analysis was run,
          // preserve that value instead of restoring from analysis results
          if (param.lastManualValue !== undefined) {
            return {
              ...storedParam,
              value: param.lastManualValue,
              changed: true,
              changedAmount: param.lastManualValue - (storedParam.originalValue || 0),
            }
          }

          // Otherwise use the stored value from analysis
          return storedParam
        })
      })
    }
  }, [analysisResults])

  // Add this useEffect to prevent parameter resets when scenarios are selected
  useEffect(() => {
    if (selectedScenario) {
      // When a scenario is selected, store the resulting parameter values as lastManualValues
      // to prevent them from being reset
      setParameters((prev) =>
        prev.map((param) => ({
          ...param,
          lastManualValue: param.value,
        })),
      )
    }
  }, [selectedScenario])

  // Remove the other parameter restoration useEffect that was causing conflicts
  // Delete this entire useEffect block:
  // useEffect(() => {
  //   // Only run when analysis results are first set or changed
  //   if (analysisResults?.parameterState && !analysisResults._parametersRestored) {
  //     // Mark that we've handled this restoration to prevent loops
  //     analysisResults._parametersRestored = true
  //
  //     // Only update parameters that have actually changed
  //     setParameters((prev) => {
  //       const needsUpdate = prev.some((p, i) => {
  //         const paramState = analysisResults.parameterState[i]
  //         return paramState && Math.abs(p.value - paramState.value) > 0.0001
  //       })
  //
  //       if (needsUpdate) {
  //         return analysisResults.parameterState
  //       }
  //       return prev
  //     })
  //   }
  // }, [analysisResults])

  useEffect(() => {
    // Safety timeout to ensure we never get stuck in loading state
    if (!resultsReady && analysisResults) {
      const safetyTimer = setTimeout(() => {
        console.log("Safety timeout triggered - forcing results ready state")
        setResultsReady(true)
      }, 3000) // 3 second safety timeout

      return () => clearTimeout(safetyTimer)
    }
  }, [resultsReady, analysisResults])

  const applySensitivityChanges = () => {
    setApplyingChanges(true)

    // Get lists of models to rerun vs preserve based on user selections
    const modelsToRerun = Object.entries(modelRunOptions)
      .filter(([_, option]) => option === "rerun")
      .map(([modelId]) => modelId)

    const modelsToPreserve = Object.entries(modelRunOptions)
      .filter(([_, option]) => option === "preserve")
      .map(([modelId]) => modelId)

    // Show summary before proceeding
    toast({
      title: "Applying Sensitivity Changes",
      description: `Running ${modelsToRerun.length} models with new parameters. Preserving ${modelsToPreserve.length} models with current values.`,
    })

    // In a real implementation, we would:
    // 1. Update model parameters with the new values
    // 2. Mark the models in modelsToPreserve as frozen so they retain their current outputs
    // 3. Run only the models in modelsToRerun

    // Freeze models that should be preserved
    modelsToPreserve.forEach((modelId) => {
      const model = getModelById(modelId)
      if (model && model.status === "completed" && !isModelFrozen(modelId)) {
        toggleModelFrozen(modelId)
      }
    })

    // Reset outputs (but not for frozen models) and run selected models
    setTimeout(() => {
      resetOutputs()
      setTimeout(() => {
        runAllModels(true)
        setApplyingChanges(false)
      }, 500)
    }, 500)
  }

  // Add this targeted useEffect to handle parameter restoration after analysis
  useEffect(() => {
    // Only run this effect when analysis results are first set
    if (analysisResults?.parameterState && !analysisResults._parametersRestored) {
      // Mark that we've handled this restoration to prevent loops
      analysisResults._parametersRestored = true

      // Log for debugging
      console.log("INITIAL PARAMETER RESTORATION - One time only")

      // Only update parameters that don't have user changes
      setParameters((prev) => {
        return prev.map((param, i) => {
          const storedParam = analysisResults.parameterState[i]
          if (!storedParam) return param

          // If this parameter has been manually changed by the user, preserve that value
          if (param.changed) {
            console.log(`Preserving user-changed parameter: ${param.id} = ${param.value}`)
            return param
          }

          // Otherwise use the stored value from analysis
          return storedParam
        })
      })
    }
  }, [analysisResults])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Sliders className="mr-2 h-5 w-5" />
              Sensitivity Analysis Dashboard
            </div>
            <div className="flex items-center gap-2">
              <SensitivityAnalysisHelp />
              <Badge variant="outline">
                {getRunState() === "IDLE" ? "Pre-Run" : getRunState() === "FINALIZED" ? "Post-Run" : "During Run"}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Analyze how changes to input parameters affect model outputs and determine which models need to be rerun
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="parameters">
                <Sliders className="h-4 w-4 mr-2" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="scenarios">
                <Layers className="h-4 w-4 mr-2" />
                Scenarios
              </TabsTrigger>
              <TabsTrigger value="thresholds">
                <AlertCircle className="h-4 w-4 mr-2" />
                Thresholds
              </TabsTrigger>
              <TabsTrigger value="results" disabled={!analysisResults}>
                <BarChart2 className="h-4 w-4 mr-2" />
                Results
              </TabsTrigger>
            </TabsList>

            {/* Parameters Tab */}
            <TabsContent value="parameters" className="p-4 border-t">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Input Parameters</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Reset parameters to original values
                        setParameters((prev) =>
                          prev.map((p) => ({
                            ...p,
                            value: p.originalValue !== undefined ? p.originalValue : p.value,
                            changed: false,
                            changedAmount: 0,
                          })),
                        )
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {parameters.map((param) => (
                      <div
                        key={param.id}
                        className={`border rounded-md p-4 space-y-3 ${param.changed ? "border-blue-300 bg-blue-50/30" : ""}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{param.name}</h4>
                              <Badge variant="outline">{param.modelName}</Badge>
                              {param.changed && (
                                <Badge className="bg-blue-100 text-blue-600">
                                  {param.changedAmount >= 0 ? "+" : ""}
                                  {param.changedAmount?.toFixed(2)} {param.unit}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Range: {param.min} to {param.max} {param.unit}
                            </p>
                          </div>
                          {param.impact && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Impact:</span>
                              {getImpactBadge(param.impact)}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-[1fr_80px] gap-4 items-center">
                          <Slider
                            value={[param.value]}
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            onValueChange={(value) => handleParameterChange(param.id, value[0])}
                          />
                          <div className="flex items-center">
                            <Input
                              type="number"
                              value={param.value}
                              onChange={(e) => handleParameterChange(param.id, Number.parseFloat(e.target.value))}
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              className="h-8"
                            />
                            <span className="ml-1">{param.unit}</span>
                          </div>
                        </div>

                        {param.totalModelsAffected && (
                          <div className="text-xs text-muted-foreground flex items-center justify-between mt-1">
                            <span>Primary Area: {param.primaryArea}</span>
                            <span>Models Affected: {param.totalModelsAffected}+</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {impactedModels.length > 0 && (
                  <div className="mt-4 border rounded-md p-4 bg-amber-50 border-amber-200">
                    <h4 className="font-medium flex items-center text-amber-800">
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                      Potentially Impacted Models
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {impactedModels.map((modelId) => {
                        const model = getModelById(modelId)
                        return (
                          <Badge
                            key={modelId}
                            variant="outline"
                            className="bg-amber-100 border-amber-200 text-amber-700"
                          >
                            {model?.name || modelId}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("thresholds")}>
                    Configure Thresholds
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button onClick={runSensitivityAnalysis} disabled={runningAnalysis}>
                    {runningAnalysis ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Sensitivity Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Scenarios Tab */}
            <TabsContent value="scenarios" className="p-4 border-t">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Predefined Scenarios</h3>
                  <div className="flex items-center gap-2">
                    {selectedScenario && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedScenario(null)
                          // Reset parameters to original values
                          setParameters((prev) =>
                            prev.map((p) => ({
                              ...p,
                              value: p.originalValue !== undefined ? p.originalValue : p.value,
                              changed: false,
                              changedAmount: 0,
                            })),
                          )
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear Scenario
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {predefinedScenarios.map((scenario) => (
                    <Card
                      key={scenario.id}
                      className={`cursor-pointer transition-all hover:border-blue-300 ${
                        selectedScenario === scenario.id ? "border-blue-500 bg-blue-50/30" : ""
                      }`}
                      onClick={() => handleScenarioSelect(scenario.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {getScenarioIcon(scenario.id)}
                            <h4 className="font-medium">{scenario.name}</h4>
                          </div>
                          <Badge className={getSeverityColor(scenario.severity)}>
                            {scenario.severity >= 80 ? "Severe" : scenario.severity >= 50 ? "Moderate" : "Mild"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{scenario.description}</p>

                        <div className="mt-4">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Key Parameter Changes:</h5>
                          <div className="flex flex-wrap gap-2">
                            {scenario.parameterChanges.slice(0, 3).map((change) => {
                              const param = parameters.find((p) => p.id === change.parameterId)
                              return (
                                <Badge key={change.parameterId} variant="outline" className="bg-blue-50">
                                  {param?.name || change.parameterId}:{" "}
                                  {change.changeType === "absolute"
                                    ? `${change.changeValue >= 0 ? "+" : ""}${change.changeValue}`
                                    : `${change.changeValue >= 0 ? "+" : ""}${change.changeValue}%`}
                                </Badge>
                              )
                            })}
                            {scenario.parameterChanges.length > 3 && (
                              <Badge variant="outline">+{scenario.parameterChanges.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("parameters")}>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Back to Parameters
                  </Button>
                  <Button onClick={runSensitivityAnalysis} disabled={runningAnalysis}>
                    {runningAnalysis ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Sensitivity Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Thresholds Tab */}
            <TabsContent value="thresholds" className="p-4 border-t">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Sensitivity Thresholds</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={saveCurrentThresholds}>
                      Save Thresholds
                    </Button>
                    <Button variant="outline" size="sm" onClick={restoreSavedThresholds} disabled={!savedThresholds}>
                      Restore Saved
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetToDefaultThresholds}>
                      Reset to Default
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Ignore Parameter Thresholds</h4>
                      <p className="text-sm text-muted-foreground">
                        Run all models regardless of parameter change magnitude
                      </p>
                    </div>
                    <Switch checked={ignoreParameterThresholds} onCheckedChange={setIgnoreParameterThresholds} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Ignore Output Thresholds</h4>
                      <p className="text-sm text-muted-foreground">
                        Run all models regardless of output change magnitude
                      </p>
                    </div>
                    <Switch checked={ignoreOutputThresholds} onCheckedChange={setIgnoreOutputThresholds} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enable Linear Approximation</h4>
                      <p className="text-sm text-muted-foreground">
                        Use linear approximation for models with small changes
                      </p>
                    </div>
                    <Switch checked={approximationEnabled} onCheckedChange={setApproximationEnabled} />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Parameter Thresholds</h3>
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-4">
                      {parameterThresholds.map((threshold) => (
                        <div key={threshold.id} className="border rounded-md p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{threshold.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Current threshold:{" "}
                                {threshold.useAbsolute
                                  ? `${threshold.absoluteThreshold} ${threshold.unit}`
                                  : `${threshold.percentageThreshold}%`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={threshold.useAbsolute ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleParameterThresholdChange(threshold.id, "useAbsolute", true)}
                              >
                                Absolute
                              </Button>
                              <Button
                                variant={!threshold.useAbsolute ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleParameterThresholdChange(threshold.id, "useAbsolute", false)}
                              >
                                Percentage
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`absolute-${threshold.id}`} className="text-sm">
                                Absolute Threshold ({threshold.unit})
                              </Label>
                              <div className="flex items-center mt-1">
                                <Input
                                  id={`absolute-${threshold.id}`}
                                  type="number"
                                  value={threshold.absoluteThreshold}
                                  onChange={(e) =>
                                    handleParameterThresholdChange(
                                      threshold.id,
                                      "absoluteThreshold",
                                      Number.parseFloat(e.target.value),
                                    )
                                  }
                                  step={0.1}
                                  min={0}
                                  className={threshold.useAbsolute ? "border-blue-300" : ""}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`percentage-${threshold.id}`} className="text-sm">
                                Percentage Threshold (%)
                              </Label>
                              <div className="flex items-center mt-1">
                                <Input
                                  id={`percentage-${threshold.id}`}
                                  type="number"
                                  value={threshold.percentageThreshold}
                                  onChange={(e) =>
                                    handleParameterThresholdChange(
                                      threshold.id,
                                      "percentageThreshold",
                                      Number.parseFloat(e.target.value),
                                    )
                                  }
                                  step={1}
                                  min={0}
                                  className={!threshold.useAbsolute ? "border-blue-300" : ""}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Output Metric Thresholds</h3>
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-4">
                      {outputThresholds.map((threshold) => (
                        <div key={threshold.id} className="border rounded-md p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{threshold.metricName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Model: {threshold.modelName} | Current threshold:{" "}
                                {threshold.useAbsolute
                                  ? `${threshold.absoluteThreshold} ${threshold.unit}`
                                  : `${threshold.percentageThreshold}%`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={threshold.useAbsolute ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleOutputThresholdChange(threshold.id, "useAbsolute", true)}
                              >
                                Absolute
                              </Button>
                              <Button
                                variant={!threshold.useAbsolute ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleOutputThresholdChange(threshold.id, "useAbsolute", false)}
                              >
                                Percentage
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`absolute-${threshold.id}`} className="text-sm">
                                Absolute Threshold ({threshold.unit})
                              </Label>
                              <div className="flex items-center mt-1">
                                <Input
                                  id={`absolute-${threshold.id}`}
                                  type="number"
                                  value={threshold.absoluteThreshold}
                                  onChange={(e) =>
                                    handleOutputThresholdChange(
                                      threshold.id,
                                      "absoluteThreshold",
                                      Number.parseFloat(e.target.value),
                                    )
                                  }
                                  step={0.1}
                                  min={0}
                                  className={threshold.useAbsolute ? "border-blue-300" : ""}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`percentage-${threshold.id}`} className="text-sm">
                                Percentage Threshold (%)
                              </Label>
                              <div className="flex items-center mt-1">
                                <Input
                                  id={`percentage-${threshold.id}`}
                                  type="number"
                                  value={threshold.percentageThreshold}
                                  onChange={(e) =>
                                    handleOutputThresholdChange(
                                      threshold.id,
                                      "percentageThreshold",
                                      Number.parseFloat(e.target.value),
                                    )
                                  }
                                  step={1}
                                  min={0}
                                  className={!threshold.useAbsolute ? "border-blue-300" : ""}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("parameters")}>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Back to Parameters
                  </Button>
                  <Button onClick={runSensitivityAnalysis} disabled={runningAnalysis}>
                    {runningAnalysis ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Sensitivity Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="p-4 border-t">
              {analysisResults ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Sensitivity Analysis Results</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("parameters")}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        New Analysis
                      </Button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={analysisResults.thresholdExceeded ? "border-red-300" : "border-green-300"}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Threshold Status</h4>
                          {analysisResults.thresholdExceeded ? (
                            <Badge className="bg-red-100 text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Thresholds Exceeded
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Within Thresholds
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {analysisResults.thresholdExceeded
                            ? "Some changes exceed defined thresholds and require full recalculation"
                            : analysisResults.thresholdsIgnored
                              ? "Threshold checks were ignored for this analysis"
                              : "All changes are within defined thresholds"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Models to Rerun</h4>
                          <Badge variant="outline">{analysisResults.rerunModels.length}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {analysisResults.rerunModels.map((modelId) => {
                            const model = getModelById(modelId)
                            return (
                              <Badge key={modelId} variant="outline" className="bg-blue-50">
                                {model?.name || modelId}
                              </Badge>
                            )
                          })}
                          {analysisResults.rerunModels.length === 0 && (
                            <p className="text-sm text-muted-foreground">No models need to be rerun</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {approximationEnabled ? "Models to Approximate" : "Models to Preserve"}
                          </h4>
                          <Badge variant="outline">{analysisResults.approximatedModels.length}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {analysisResults.approximatedModels.map((modelId) => {
                            const model = getModelById(modelId)
                            return (
                              <Badge key={modelId} variant="outline" className="bg-green-50">
                                {model?.name || modelId}
                              </Badge>
                            )
                          })}
                          {analysisResults.approximatedModels.length === 0 && (
                            <p className="text-sm text-muted-foreground">No models will be approximated</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Model Run Options */}
                  {resultsReady && Object.keys(modelRunOptions).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Model Run Options</CardTitle>
                        <CardDescription>
                          Choose which models to rerun with new parameters vs. preserve current results
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(modelRunOptions).map(([modelId, option]) => {
                            const model = getModelById(modelId)
                            return (
                              <div key={modelId} className="flex items-center justify-between border rounded-md p-3">
                                <div>
                                  <h4 className="font-medium">{model?.name || modelId}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {option === "rerun"
                                      ? "Will be rerun with new parameters"
                                      : "Current results will be preserved"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={
                                      option === "rerun" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                                    }
                                  >
                                    {option === "rerun" ? "Rerun" : "Preserve"}
                                  </Badge>
                                  <Button variant="outline" size="sm" onClick={() => toggleModelRunOption(modelId)}>
                                    Toggle
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Impact Visualization */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Impact on Outputs</CardTitle>
                      <CardDescription>Percentage change in output metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                      <BarChart
                        data={generateImpactChartData()}
                        index="name"
                        categories={["value"]}
                        colors={["blue"]}
                        valueFormatter={(value) => `${value.toFixed(2)}%`}
                        showLegend={false}
                      />
                    </CardContent>
                  </Card>

                  {/* Detailed Changes Table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Detailed Changes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2 text-xs font-medium">Metric</th>
                              <th className="text-left p-2 text-xs font-medium">Model</th>
                              <th className="text-left p-2 text-xs font-medium">Original Value</th>
                              <th className="text-left p-2 text-xs font-medium">New Value</th>
                              <th className="text-left p-2 text-xs font-medium">Change</th>
                              <th className="text-left p-2 text-xs font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(analysisResults.changes).map((metricId) => {
                              const change = analysisResults.changes[metricId]
                              if (!change) return null

                              // Find the metric in outputMetrics
                              const metric = outputMetrics.find((m) => m.id === metricId)
                              if (!metric) return null

                              const originalValue = analysisResults.originalValues[metricId]
                              const newValue = analysisResults.newValues[metricId]

                              return (
                                <tr key={metricId} className="border-t">
                                  <td className="p-2 text-sm font-medium">{metric.name}</td>
                                  <td className="p-2 text-sm">{metric.modelName}</td>
                                  <td className="p-2 text-sm">
                                    {originalValue?.toFixed(2)} {metric.unit}
                                  </td>
                                  <td className="p-2 text-sm">
                                    {newValue?.toFixed(2)} {metric.unit}
                                  </td>
                                  <td className="p-2 text-sm">
                                    <span className={change.absolute >= 0 ? "text-green-600" : "text-red-600"}>
                                      {change.absolute >= 0 ? "+" : ""}
                                      {change.absolute.toFixed(2)} {metric.unit}({change.percentage >= 0 ? "+" : ""}
                                      {change.percentage.toFixed(2)}%)
                                    </span>
                                  </td>
                                  <td className="p-2 text-sm">
                                    {change.preserved ? (
                                      <Badge className="bg-blue-100 text-blue-600">Preserved</Badge>
                                    ) : change.thresholdExceeded ? (
                                      <Badge className="bg-red-100 text-red-600">Threshold Exceeded</Badge>
                                    ) : (
                                      <Badge className="bg-green-100 text-green-600">Within Threshold</Badge>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Apply Changes Button */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveTab("parameters")
                        setAnalysisResults(null)
                        setOriginalAnalysisResults(null)
                        setModelRunOptions({})
                        setResultsReady(false)
                      }}
                    >
                      Discard Changes
                    </Button>
                    <Button
                      onClick={applySensitivityChanges}
                      disabled={applyingChanges || getRunState() === "FINALIZED"}
                    >
                      {applyingChanges ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Applying Changes...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Apply Changes & Run Models
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Analysis Results</h3>
                  <p className="text-muted-foreground mb-4">Run a sensitivity analysis to see results here</p>
                  <Button onClick={() => setActiveTab("parameters")}>
                    <Sliders className="mr-2 h-4 w-4" />
                    Go to Parameters
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default SensitivityAnalysisDashboard
