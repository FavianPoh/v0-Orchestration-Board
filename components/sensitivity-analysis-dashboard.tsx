"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useModelState } from "@/context/model-state-context"
import { BarChart } from "@/components/ui/chart"
import {
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Sliders,
  BarChart2,
  Zap,
  Layers,
  Thermometer,
  Percent,
  Hash,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  WormIcon as Virus,
  Briefcase,
  Globe,
  TrendingDown,
  TrendingUp,
  Building,
  DollarSign,
  Cloud,
} from "lucide-react"
import { SensitivityAnalysisHelp } from "@/components/sensitivity-analysis-help"

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
    severity: 85,
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
    severity: 65,
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
    severity: 75,
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
    severity: 40, // Positive scenario, lower severity
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
    severity: 70,
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
    severity: 75,
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
    severity: 80,
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
    severity: 70,
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
    severity: 30, // Positive scenario, lower severity
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
    severity: 60,
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
  const [scenarioSeverity, setScenarioSeverity] = useState(50)
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

  // Handle parameter value change
  const handleParameterChange = (id: string, value: number) => {
    setParameters((prevParams) =>
      prevParams.map((param) => (param.id === id ? { ...param, value, changed: true } : param)),
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
    setSelectedScenario(scenarioId)
    const scenario = predefinedScenarios.find((s) => s.id === scenarioId)

    if (scenario) {
      // Reset parameters to original values
      setParameters((prevParams) => prevParams.map((param) => ({ ...param, changed: false })))

      // Apply scenario changes with severity adjustment
      const severityFactor = scenarioSeverity / 100

      // Apply changes to parameters
      setParameters((prevParams) =>
        prevParams.map((param) => {
          const change = scenario.parameterChanges.find((c) => c.parameterId === param.id)
          if (change) {
            let newValue
            if (change.changeType === "absolute") {
              newValue = param.value + change.changeValue * severityFactor
            } else {
              // Percentage change
              newValue = param.value * (1 + (change.changeValue * severityFactor) / 100)
            }

            // Ensure value is within bounds
            if (param.min !== undefined && newValue < param.min) newValue = param.min
            if (param.max !== undefined && newValue > param.max) newValue = param.max

            return { ...param, value: newValue, changed: true }
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

  // Handle scenario severity change
  const handleSeverityChange = (value: number[]) => {
    const newSeverity = value[0]
    setScenarioSeverity(newSeverity)

    // Re-apply scenario with new severity
    if (selectedScenario) {
      handleScenarioSelect(selectedScenario)
    }
  }

  // Run sensitivity analysis
  const runSensitivityAnalysis = () => {
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

      // For each output metric, generate a simulated change
      outputMetrics.forEach((metric) => {
        const originalValue = Number.parseFloat(metric.value)
        if (isNaN(originalValue)) return

        // Check if this metric's model is impacted
        const isImpacted = impactedModels.includes(metric.modelId)

        if (isImpacted) {
          // Generate a change based on whether the model is directly or indirectly impacted
          const directlyImpacted = parameters.some((p) => p.changed && p.modelId === metric.modelId)

          // Larger changes for directly impacted models
          const changeFactor = directlyImpacted
            ? (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1)
            : (Math.random() * 0.15 + 0.05) * (Math.random() > 0.5 ? 1 : -1)

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
            results.rerunModels.push(metric.modelId)
          } else if (approximationEnabled) {
            results.approximatedModels.push(metric.modelId)
          } else {
            results.rerunModels.push(metric.modelId)
          }
        }
      })

      // Remove duplicates from rerun and approximated models
      results.rerunModels = [...new Set(results.rerunModels)]
      results.approximatedModels = [...new Set(results.approximatedModels)]

      // If we're ignoring all thresholds, override the threshold exceeded flag
      if (ignoreParameterThresholds && ignoreOutputThresholds) {
        results.thresholdExceeded = false

        // Move all models from rerunModels to approximatedModels if approximation is enabled
        if (approximationEnabled) {
          results.approximatedModels = [...new Set([...results.approximatedModels, ...results.rerunModels])]
          results.rerunModels = []
        }
      }

      setAnalysisResults(results)
      setRunningAnalysis(false)

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

  // Function to save current thresholds
  const saveCurrentThresholds = () => {
    setSavedThresholds({
      parameters: [...parameterThresholds],
      outputs: [...outputThresholds],
    })
    toast({
      title: "Thresholds Saved",
      description: "Current threshold settings have been saved for future reference.",
    })
  }

  // Function to reset thresholds to defaults
  const resetToDefaultThresholds = () => {
    // Reset parameter thresholds
    setParameterThresholds((prevThresholds) =>
      prevThresholds.map((threshold) => {
        const defaultThreshold = DEFAULT_PARAMETER_THRESHOLDS[threshold.id]
        if (defaultThreshold) {
          return {
            ...threshold,
            absoluteThreshold: defaultThreshold.absoluteThreshold,
            percentageThreshold: defaultThreshold.percentageThreshold,
            useAbsolute: defaultThreshold.useAbsolute,
          }
        }
        return threshold
      }),
    )

    // Reset output thresholds
    setOutputThresholds((prevThresholds) =>
      prevThresholds.map((threshold) => {
        const defaultThreshold = DEFAULT_OUTPUT_THRESHOLDS[threshold.modelId]
        if (defaultThreshold) {
          return {
            ...threshold,
            absoluteThreshold: defaultThreshold.absoluteThreshold,
            percentageThreshold: defaultThreshold.percentageThreshold,
            useAbsolute: defaultThreshold.useAbsolute,
          }
        }
        return threshold
      }),
    )

    toast({
      title: "Thresholds Reset",
      description: "All thresholds have been reset to default values.",
    })
  }

  // Function to restore saved thresholds
  const restoreSavedThresholds = () => {
    if (savedThresholds) {
      setParameterThresholds(savedThresholds.parameters)
      setOutputThresholds(savedThresholds.outputs)

      toast({
        title: "Thresholds Restored",
        description: "Saved threshold settings have been restored.",
      })
    } else {
      toast({
        title: "No Saved Thresholds",
        description: "There are no saved thresholds to restore.",
        variant: "destructive",
      })
    }
  }

  // Apply sensitivity changes and run models
  const applySensitivityChanges = () => {
    if (!analysisResults) return

    // In a real implementation, we would:
    // 1. Update model parameters with the new values
    // 2. Mark models for approximation or full rerun
    // 3. Run the workflow

    toast({
      title: "Applying Sensitivity Changes",
      description: `Running ${analysisResults.rerunModels.length} models with full recalculation and approximating ${analysisResults.approximatedModels.length} models.`,
    })

    // Reset outputs and run all models
    resetOutputs()

    // In a real implementation, we would selectively run models
    // For now, we'll just run all models
    setTimeout(() => {
      runAllModels(true)
    }, 500)
  }

  // Generate chart data for sensitivity impact visualization
  const generateImpactChartData = () => {
    if (!analysisResults) return []

    const data = []

    // Group by model
    const modelMetrics = {}

    outputMetrics.forEach((metric) => {
      if (!modelMetrics[metric.modelName]) {
        modelMetrics[metric.modelName] = []
      }

      if (analysisResults.changes[metric.id]) {
        modelMetrics[metric.modelName].push({
          name: metric.name,
          id: metric.id,
          change: analysisResults.changes[metric.id].percentage,
        })
      }
    })

    // Create chart data
    Object.keys(modelMetrics).forEach((modelName) => {
      const metrics = modelMetrics[modelName]

      // Sort by absolute change magnitude
      metrics.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

      // Take top 5 metrics
      const topMetrics = metrics.slice(0, 5)

      topMetrics.forEach((metric) => {
        data.push({
          metric: metric.name,
          model: modelName,
          change: metric.change,
        })
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
                      onClick={() => setParameters((prev) => prev.map((p) => ({ ...p, changed: false })))}
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
                              {param.changed && <Badge className="bg-blue-100 text-blue-600">Modified</Badge>}
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Predefined Scenarios</h3>
                  <Button variant="outline" size="sm" onClick={() => setSelectedScenario(null)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {predefinedScenarios.map((scenario) => (
                    <Card
                      key={scenario.id}
                      className={`cursor-pointer hover:border-blue-300 transition-colors ${
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
                          <Badge className={getSeverityColor(scenario.severity)}>Severity: {scenario.severity}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{scenario.description}</p>

                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-1">Parameter Changes:</h5>
                          <div className="space-y-1">
                            {scenario.parameterChanges.map((change) => {
                              const param = parameters.find((p) => p.id === change.parameterId)
                              return (
                                <div key={change.parameterId} className="flex justify-between text-sm">
                                  <span>{param?.name || change.parameterId}:</span>
                                  <span className={change.changeValue >= 0 ? "text-green-600" : "text-red-600"}>
                                    {change.changeType === "absolute" ? (
                                      <>
                                        {change.changeValue >= 0 ? "+" : ""}
                                        {change.changeValue} {param?.unit}
                                      </>
                                    ) : (
                                      <>
                                        {change.changeValue >= 0 ? "+" : ""}
                                        {change.changeValue}%
                                      </>
                                    )}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedScenario && (
                  <div className="mt-6 border rounded-md p-4">
                    <h4 className="font-medium mb-2">Scenario Severity Adjustment</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Mild</span>
                      <Slider
                        value={[scenarioSeverity]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={handleSeverityChange}
                        className="flex-1"
                      />
                      <span className="text-sm">Severe</span>
                      <Badge className={getSeverityColor(scenarioSeverity)}>{scenarioSeverity}%</Badge>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("parameters")}>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Adjust Parameters
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
                {/* Tabs for Parameter vs Output Thresholds */}
                <Tabs defaultValue="parameters" className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <TabsList>
                      <TabsTrigger value="parameters">Parameter Thresholds</TabsTrigger>
                      <TabsTrigger value="outputs">Output Thresholds</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      >
                        {showAdvancedSettings ? "Hide" : "Show"} Advanced Settings
                        {showAdvancedSettings ? (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Parameter Thresholds Content */}
                  <TabsContent value="parameters" className="mt-0">
                    <div className="border rounded-md p-4 mb-4 bg-muted/20">
                      <h3 className="text-md font-medium mb-3">Threshold Management</h3>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="ignore-param-thresholds" className="text-sm">
                              Ignore Parameter Thresholds
                            </Label>
                            <Switch
                              id="ignore-param-thresholds"
                              checked={ignoreParameterThresholds}
                              onCheckedChange={setIgnoreParameterThresholds}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <Label htmlFor="ignore-output-thresholds" className="text-sm">
                              Ignore Output Thresholds
                            </Label>
                            <Switch
                              id="ignore-output-thresholds"
                              checked={ignoreOutputThresholds}
                              onCheckedChange={setIgnoreOutputThresholds}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <Button size="sm" variant="outline" onClick={saveCurrentThresholds}>
                              Save Current
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={restoreSavedThresholds}
                              disabled={!savedThresholds}
                            >
                              Restore Saved
                            </Button>
                            <Button size="sm" variant="outline" onClick={resetToDefaultThresholds}>
                              Reset to Defaults
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIgnoreParameterThresholds(true)
                              setIgnoreOutputThresholds(true)
                            }}
                          >
                            Ignore All Thresholds
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md mb-4">
                      <p className="text-sm text-muted-foreground">
                        Parameter thresholds determine when a change to an input parameter is considered significant.
                        Changes below these thresholds may be approximated rather than fully recalculated.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parameterThresholds.map((threshold) => (
                        <Card key={threshold.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/30 py-3">
                            <CardTitle className="text-base flex justify-between items-center">
                              <span>{threshold.name}</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant={threshold.useAbsolute ? "default" : "outline"}
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleParameterThresholdChange(threshold.id, "useAbsolute", true)}
                                >
                                  <Hash className="h-3 w-3 mr-1" />
                                  Absolute
                                </Button>
                                <Button
                                  variant={!threshold.useAbsolute ? "default" : "outline"}
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleParameterThresholdChange(threshold.id, "useAbsolute", false)}
                                >
                                  <Percent className="h-3 w-3 mr-1" />
                                  Percentage
                                </Button>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor={`abs-${threshold.id}`}
                                  className={`text-sm mb-1 block ${threshold.useAbsolute ? "font-medium" : ""}`}
                                >
                                  Absolute Threshold {threshold.unit && `(${threshold.unit})`}
                                </Label>
                                <Input
                                  id={`abs-${threshold.id}`}
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
                                  className={threshold.useAbsolute ? "border-primary" : ""}
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`pct-${threshold.id}`}
                                  className={`text-sm mb-1 block ${!threshold.useAbsolute ? "font-medium" : ""}`}
                                >
                                  Percentage Threshold (%)
                                </Label>
                                <Input
                                  id={`pct-${threshold.id}`}
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
                                  className={!threshold.useAbsolute ? "border-primary" : ""}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Output Thresholds Content */}
                  <TabsContent value="outputs" className="mt-0">
                    <div className="bg-muted/30 p-3 rounded-md mb-4">
                      <p className="text-sm text-muted-foreground">
                        Output metric thresholds determine when a change to a model output is considered significant.
                        Models with output changes exceeding these thresholds will be fully recalculated.
                      </p>
                    </div>

                    {/* Group by model */}
                    {(() => {
                      // Group thresholds by model
                      const modelGroups = {}
                      outputThresholds.forEach((threshold) => {
                        if (!modelGroups[threshold.modelId]) {
                          modelGroups[threshold.modelId] = {
                            modelName: threshold.modelName,
                            thresholds: [],
                          }
                        }
                        modelGroups[threshold.modelId].thresholds.push(threshold)
                      })

                      return Object.entries(modelGroups).map(([modelId, group]) => (
                        <div key={modelId} className="mb-6">
                          <h3 className="text-md font-medium mb-3 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                            {group.modelName}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.thresholds.map((threshold) => (
                              <Card key={threshold.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/30 py-3">
                                  <CardTitle className="text-base flex justify-between items-center">
                                    <span>{threshold.metricName}</span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant={threshold.useAbsolute ? "default" : "outline"}
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleOutputThresholdChange(threshold.id, "useAbsolute", true)}
                                      >
                                        <Hash className="h-3 w-3 mr-1" />
                                        Absolute
                                      </Button>
                                      <Button
                                        variant={!threshold.useAbsolute ? "default" : "outline"}
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleOutputThresholdChange(threshold.id, "useAbsolute", false)}
                                      >
                                        <Percent className="h-3 w-3 mr-1" />
                                        Percentage
                                      </Button>
                                    </div>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label
                                        htmlFor={`abs-out-${threshold.id}`}
                                        className={`text-sm mb-1 block ${threshold.useAbsolute ? "font-medium" : ""}`}
                                      >
                                        Absolute Threshold {threshold.unit && `(${threshold.unit})`}
                                      </Label>
                                      <Input
                                        id={`abs-out-${threshold.id}`}
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
                                        className={threshold.useAbsolute ? "border-primary" : ""}
                                      />
                                    </div>
                                    <div>
                                      <Label
                                        htmlFor={`pct-out-${threshold.id}`}
                                        className={`text-sm mb-1 block ${!threshold.useAbsolute ? "font-medium" : ""}`}
                                      >
                                        Percentage Threshold (%)
                                      </Label>
                                      <Input
                                        id={`pct-out-${threshold.id}`}
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
                                        className={!threshold.useAbsolute ? "border-primary" : ""}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Default Threshold Values</CardTitle>
                      <CardDescription>Reference for original threshold settings</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Tabs defaultValue="param-defaults">
                        <TabsList className="mb-4">
                          <TabsTrigger value="param-defaults">Parameter Defaults</TabsTrigger>
                          <TabsTrigger value="output-defaults">Output Defaults</TabsTrigger>
                        </TabsList>

                        <TabsContent value="param-defaults">
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-2 text-xs font-medium">Parameter</th>
                                  <th className="text-left p-2 text-xs font-medium">Absolute Threshold</th>
                                  <th className="text-left p-2 text-xs font-medium">Percentage Threshold</th>
                                  <th className="text-left p-2 text-xs font-medium">Default Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(DEFAULT_PARAMETER_THRESHOLDS).map(([id, defaults]) => {
                                  const param = parameters.find((p) => p.id === id)
                                  return (
                                    <tr key={id} className="border-t">
                                      <td className="p-2 text-sm font-medium">{param?.name || id}</td>
                                      <td className="p-2 text-sm">{defaults.absoluteThreshold}</td>
                                      <td className="p-2 text-sm">{defaults.percentageThreshold}%</td>
                                      <td className="p-2 text-sm">
                                        {defaults.useAbsolute ? "Absolute" : "Percentage"}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </TabsContent>

                        <TabsContent value="output-defaults">
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-2 text-xs font-medium">Model</th>
                                  <th className="text-left p-2 text-xs font-medium">Absolute Threshold</th>
                                  <th className="text-left p-2 text-xs font-medium">Percentage Threshold</th>
                                  <th className="text-left p-2 text-xs font-medium">Default Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(DEFAULT_OUTPUT_THRESHOLDS).map(([modelId, defaults]) => {
                                  const model = modelGroups.find((m) => m.id === modelId)
                                  return (
                                    <tr key={modelId} className="border-t">
                                      <td className="p-2 text-sm font-medium">{model?.name || modelId}</td>
                                      <td className="p-2 text-sm">{defaults.absoluteThreshold}</td>
                                      <td className="p-2 text-sm">{defaults.percentageThreshold}%</td>
                                      <td className="p-2 text-sm">
                                        {defaults.useAbsolute ? "Absolute" : "Percentage"}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>

                {showAdvancedSettings && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-4">Advanced Settings</h3>
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Enable Approximation</h4>
                              <p className="text-sm text-muted-foreground">
                                Use linear approximation for small changes below threshold
                              </p>
                            </div>
                            <Switch checked={approximationEnabled} onCheckedChange={setApproximationEnabled} />
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Comparison Mode</h4>
                              <p className="text-sm text-muted-foreground">
                                How to display comparison between original and new values
                              </p>
                            </div>
                            <Select value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="side-by-side">Side by Side</SelectItem>
                                <SelectItem value="overlay">Overlay</SelectItem>
                                <SelectItem value="difference">Difference</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

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
                      <Select value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="side-by-side">Side by Side</SelectItem>
                          <SelectItem value="overlay">Overlay</SelectItem>
                          <SelectItem value="difference">Difference</SelectItem>
                        </SelectContent>
                      </Select>
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
                          {analysisResults.thresholdsIgnored ? (
                            <Badge className="bg-purple-100 text-purple-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Thresholds Ignored
                            </Badge>
                          ) : analysisResults.thresholdExceeded ? (
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
                          {analysisResults.thresholdsIgnored
                            ? "Threshold checks were ignored for this analysis. All models will be processed according to your approximation settings."
                            : analysisResults.thresholdExceeded
                              ? "Some changes exceed defined thresholds and require full recalculation"
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
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Models to Approximate</h4>
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
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Impact Visualization */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Impact on Key Metrics</CardTitle>
                      <CardDescription>Percentage change in output metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <BarChart
                        data={generateImpactChartData()}
                        index="metric"
                        categories={["change"]}
                        colors={["blue"]}
                        valueFormatter={(value) => `${value.toFixed(2)}%`}
                      />
                    </CardContent>
                  </Card>

                  {/* Detailed Changes Table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Detailed Changes</CardTitle>
                      <CardDescription>Changes to output metrics by model</CardDescription>
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
                            {outputMetrics.map((metric) => {
                              const change = analysisResults.changes[metric.id]
                              if (!change) return null

                              return (
                                <tr key={metric.id} className="border-t">
                                  <td className="p-2 text-sm font-medium">{metric.name}</td>
                                  <td className="p-2 text-sm">{metric.modelName}</td>
                                  <td className="p-2 text-sm">
                                    {analysisResults.originalValues[metric.id]?.toFixed(2)} {metric.unit}
                                  </td>
                                  <td className="p-2 text-sm">
                                    {analysisResults.newValues[metric.id]?.toFixed(2)} {metric.unit}
                                  </td>
                                  <td className="p-2 text-sm">
                                    <span className={change.absolute >= 0 ? "text-green-600" : "text-red-600"}>
                                      {change.absolute >= 0 ? "+" : ""}
                                      {change.absolute.toFixed(2)} {metric.unit}({change.percentage >= 0 ? "+" : ""}
                                      {change.percentage.toFixed(2)}%)
                                    </span>
                                  </td>
                                  <td className="p-2 text-sm">
                                    {analysisResults.thresholdsIgnored ? (
                                      <Badge className="bg-purple-100 text-purple-600">Checks Ignored</Badge>
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

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setActiveTab("parameters")}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      New Analysis
                    </Button>
                    <Button onClick={applySensitivityChanges}>
                      <Play className="mr-2 h-4 w-4" />
                      Apply Changes & Run Models
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
