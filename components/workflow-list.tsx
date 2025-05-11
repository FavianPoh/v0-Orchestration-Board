"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronDown, Play, Settings, Info, Code } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

// Sample data structure with modules
const workflows = [
  {
    id: 1,
    name: "Economic Impact Analysis",
    status: "active",
    lastRun: "2 hours ago",
    moduleCount: 6,
    modules: [
      {
        id: "eco-1",
        name: "GDP Calculator",
        description: "Calculates GDP based on economic inputs",
        inputs: [
          { name: "baseGDP", type: "number", value: 21500, unit: "billion USD" },
          { name: "growthRate", type: "number", value: 2.5, unit: "%" },
          { name: "inflationRate", type: "number", value: 3.2, unit: "%" },
        ],
        outputs: [
          { name: "projectedGDP", type: "number", unit: "billion USD" },
          { name: "realGrowth", type: "number", unit: "%" },
        ],
        code: "function calculateGDP(baseGDP, growthRate, inflationRate) {\n  const nominalGrowth = baseGDP * (1 + growthRate / 100);\n  const realGrowth = (nominalGrowth / baseGDP - inflationRate / 100) * 100;\n  return {\n    projectedGDP: nominalGrowth,\n    realGrowth: realGrowth\n  };\n}",
        explanation:
          "This module calculates projected GDP by applying the growth rate to the base GDP. It also calculates real growth by adjusting for inflation.",
      },
      {
        id: "eco-2",
        name: "Inflation Model",
        description: "Projects inflation based on economic factors",
        inputs: [
          { name: "currentInflation", type: "number", value: 3.2, unit: "%" },
          { name: "moneySupplyGrowth", type: "number", value: 4.5, unit: "%" },
          { name: "outputGap", type: "number", value: -0.8, unit: "%" },
        ],
        outputs: [{ name: "projectedInflation", type: "number", unit: "%" }],
        code: "function projectInflation(currentInflation, moneySupplyGrowth, outputGap) {\n  return {\n    projectedInflation: currentInflation * 0.7 + moneySupplyGrowth * 0.2 - outputGap * 0.1\n  };\n}",
        explanation:
          "This module forecasts inflation using a weighted average of current inflation, money supply growth, and the output gap.",
      },
      {
        id: "eco-3",
        name: "Employment Rate",
        description: "Calculates employment metrics",
        inputs: [
          { name: "laborForce", type: "number", value: 165, unit: "million" },
          { name: "employed", type: "number", value: 155, unit: "million" },
        ],
        outputs: [
          { name: "employmentRate", type: "number", unit: "%" },
          { name: "unemploymentRate", type: "number", unit: "%" },
        ],
        code: "function calculateEmployment(laborForce, employed) {\n  const employmentRate = (employed / laborForce) * 100;\n  return {\n    employmentRate: employmentRate,\n    unemploymentRate: 100 - employmentRate\n  };\n}",
        explanation:
          "This module calculates the employment rate by dividing the number of employed people by the total labor force. It also calculates the unemployment rate as the complement of the employment rate.",
      },
      {
        id: "eco-4",
        name: "Economic Indicators",
        description: "Aggregates key economic indicators",
        inputs: [
          { name: "gdpGrowth", type: "number", value: 2.5, unit: "%" },
          { name: "inflation", type: "number", value: 3.2, unit: "%" },
          { name: "unemploymentRate", type: "number", value: 5.8, unit: "%" },
        ],
        outputs: [{ name: "economicHealthIndex", type: "number", unit: "index" }],
        code: "function calculateEconomicHealth(gdpGrowth, inflation, unemploymentRate) {\n  return {\n    economicHealthIndex: gdpGrowth * 0.4 - inflation * 0.3 - unemploymentRate * 0.3 + 5\n  };\n}",
        explanation:
          "This module creates an economic health index by combining GDP growth (positive factor), inflation (negative factor), and unemployment (negative factor) with appropriate weights.",
      },
      {
        id: "eco-5",
        name: "Phillips Curve Analyzer",
        description: "Analyzes the nonlinear relationship between unemployment and inflation",
        inputs: [
          { name: "unemploymentRate", type: "number", value: 5.8, unit: "%" },
          { name: "naturalRate", type: "number", value: 4.5, unit: "%" },
          { name: "expectationCoefficient", type: "number", value: 0.7, unit: "" },
        ],
        outputs: [
          { name: "inflationChange", type: "number", unit: "%" },
          { name: "expectedInflation", type: "number", unit: "%" },
        ],
        code: "function phillipsCurve(unemploymentRate, naturalRate, expectationCoefficient) {\n  // Nonlinear relationship between unemployment and inflation\n  const gap = naturalRate - unemploymentRate;\n  const inflationChange = Math.exp(gap) - 1;\n  const expectedInflation = 2 + expectationCoefficient * inflationChange;\n  return {\n    inflationChange: inflationChange,\n    expectedInflation: expectedInflation\n  };\n}",
        explanation:
          "This module implements a nonlinear Phillips curve relationship between unemployment and inflation. It uses an exponential function to model how inflation changes as unemployment deviates from its natural rate.",
      },
      {
        id: "eco-6",
        name: "Okun's Law Calculator",
        description: "Calculates the nonlinear relationship between GDP growth and unemployment",
        inputs: [
          { name: "gdpGrowth", type: "number", value: 2.5, unit: "%" },
          { name: "potentialGrowth", type: "number", value: 2.0, unit: "%" },
          { name: "okunCoefficient", type: "number", value: 0.4, unit: "" },
        ],
        outputs: [
          { name: "unemploymentChange", type: "number", unit: "%" },
          { name: "outputGap", type: "number", unit: "%" },
        ],
        code: "function okunsLaw(gdpGrowth, potentialGrowth, okunCoefficient) {\n  // Nonlinear relationship with diminishing returns\n  const growthGap = gdpGrowth - potentialGrowth;\n  const outputGap = growthGap * (1 - Math.exp(-Math.abs(growthGap)) * 0.3);\n  const unemploymentChange = -okunCoefficient * outputGap;\n  return {\n    unemploymentChange: unemploymentChange,\n    outputGap: outputGap\n  };\n}",
        explanation:
          "This module implements Okun's Law with a nonlinear twist. It calculates how unemployment changes based on the gap between actual and potential GDP growth, with diminishing effects at extreme values.",
      },
    ],
  },
  {
    id: 2,
    name: "Financial Forecast",
    status: "inactive",
    lastRun: "1 day ago",
    moduleCount: 5,
    modules: [
      {
        id: "fin-1",
        name: "Interest Rate",
        description: "Projects interest rates based on economic conditions",
        inputs: [
          { name: "currentRate", type: "number", value: 4.5, unit: "%" },
          { name: "inflation", type: "number", value: 3.2, unit: "%" },
          { name: "gdpGrowth", type: "number", value: 2.5, unit: "%" },
        ],
        outputs: [{ name: "projectedRate", type: "number", unit: "%" }],
        code: "function projectInterestRate(currentRate, inflation, gdpGrowth) {\n  return {\n    projectedRate: currentRate * 0.6 + inflation * 0.3 + gdpGrowth * 0.1\n  };\n}",
        explanation:
          "This module forecasts interest rates using a weighted combination of the current rate, inflation, and GDP growth.",
      },
      {
        id: "fin-2",
        name: "Stock Market",
        description: "Projects stock market performance",
        inputs: [
          { name: "currentIndex", type: "number", value: 4200, unit: "points" },
          { name: "interestRate", type: "number", value: 4.5, unit: "%" },
          { name: "corporateEarnings", type: "number", value: 2200, unit: "billion USD" },
        ],
        outputs: [{ name: "projectedIndex", type: "number", unit: "points" }],
        code: "function projectStockMarket(currentIndex, interestRate, corporateEarnings) {\n  const earningsMultiplier = 20 - interestRate;\n  return {\n    projectedIndex: corporateEarnings * earningsMultiplier\n  };\n}",
        explanation:
          "This module projects stock market performance by applying an earnings multiplier (which is inversely related to interest rates) to corporate earnings.",
      },
      {
        id: "fin-3",
        name: "Currency Exchange",
        description: "Projects currency exchange rates",
        inputs: [
          { name: "currentRate", type: "number", value: 1.1, unit: "EUR/USD" },
          { name: "domesticInterestRate", type: "number", value: 4.5, unit: "%" },
          { name: "foreignInterestRate", type: "number", value: 3.5, unit: "%" },
        ],
        outputs: [{ name: "projectedRate", type: "number", unit: "EUR/USD" }],
        code: "function projectExchangeRate(currentRate, domesticInterestRate, foreignInterestRate) {\n  const interestRateDifferential = domesticInterestRate - foreignInterestRate;\n  return {\n    projectedRate: currentRate * (1 - interestRateDifferential / 100)\n  };\n}",
        explanation:
          "This module projects exchange rates based on the interest rate differential between domestic and foreign rates, following the interest rate parity theory.",
      },
      {
        id: "fin-4",
        name: "Black-Scholes Option Pricer",
        description: "Calculates option prices using the Black-Scholes model",
        inputs: [
          { name: "stockPrice", type: "number", value: 100, unit: "USD" },
          { name: "strikePrice", type: "number", value: 105, unit: "USD" },
          { name: "timeToMaturity", type: "number", value: 1, unit: "years" },
          { name: "riskFreeRate", type: "number", value: 0.05, unit: "" },
          { name: "volatility", type: "number", value: 0.2, unit: "" },
        ],
        outputs: [
          { name: "callPrice", type: "number", unit: "USD" },
          { name: "putPrice", type: "number", unit: "USD" },
        ],
        code: "function blackScholes(stockPrice, strikePrice, timeToMaturity, riskFreeRate, volatility) {\n  // Simplified Black-Scholes implementation\n  const d1 = (Math.log(stockPrice / strikePrice) + (riskFreeRate + volatility * volatility / 2) * timeToMaturity) / (volatility * Math.sqrt(timeToMaturity));\n  const d2 = d1 - volatility * Math.sqrt(timeToMaturity);\n  \n  // Approximation of cumulative normal distribution\n  const cnd = (x) => {\n    const a1 = 0.31938153;\n    const a2 = -0.356563782;\n    const a3 = 1.781477937;\n    const a4 = -1.821255978;\n    const a5 = 1.330274429;\n    const k = 1.0 / (1.0 + 0.2316419 * Math.abs(x));\n    let result = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-x * x / 2) * (a1 * k + a2 * k * k + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5));\n    if (x < 0) result = 1.0 - result;\n    return result;\n  };\n  \n  const callPrice = stockPrice * cnd(d1) - strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * cnd(d2);\n  const putPrice = strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * cnd(-d2) - stockPrice * cnd(-d1);\n  \n  return {\n    callPrice: callPrice,\n    putPrice: putPrice\n  };\n}",
        explanation:
          "This module implements the Black-Scholes option pricing model, a nonlinear mathematical model used to calculate the theoretical price of European-style options. It accounts for the current stock price, strike price, time to maturity, risk-free rate, and volatility.",
      },
      {
        id: "fin-5",
        name: "Yield Curve Generator",
        description: "Generates a yield curve based on short and long-term rates",
        inputs: [
          { name: "shortTermRate", type: "number", value: 3.5, unit: "%" },
          { name: "longTermRate", type: "number", value: 4.2, unit: "%" },
          { name: "curvature", type: "number", value: 0.3, unit: "" },
        ],
        outputs: [
          { name: "yieldCurve", type: "object", unit: "array" },
          { name: "inverted", type: "boolean", unit: "" },
        ],
        code: "function generateYieldCurve(shortTermRate, longTermRate, curvature) {\n  // Nonlinear yield curve generation using Nelson-Siegel model (simplified)\n  const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30];\n  const yieldCurve = maturities.map(maturity => {\n    // Nonlinear transformation with curvature parameter\n    const weight = 1 - Math.exp(-curvature * maturity);\n    const rate = shortTermRate + (longTermRate - shortTermRate) * weight / (curvature * maturity) * (1 - Math.exp(-curvature * maturity));\n    return { maturity, rate };\n  });\n  \n  return {\n    yieldCurve: yieldCurve,\n    inverted: shortTermRate > longTermRate\n  };\n}",
        explanation:
          "This module generates a yield curve using a simplified version of the Nelson-Siegel model, which is a nonlinear model for interest rates across different maturities. It takes short-term and long-term rates along with a curvature parameter to shape the curve.",
      },
    ],
  },
  {
    id: 3,
    name: "Risk Assessment Pipeline",
    status: "active",
    lastRun: "3 hours ago",
    moduleCount: 7,
    modules: [
      {
        id: "risk-1",
        name: "Market Risk",
        description: "Assesses market-related risks",
        inputs: [
          { name: "volatility", type: "number", value: 15, unit: "%" },
          { name: "beta", type: "number", value: 1.2, unit: "" },
        ],
        outputs: [{ name: "marketRiskScore", type: "number", unit: "score" }],
        code: "function assessMarketRisk(volatility, beta) {\n  return {\n    marketRiskScore: volatility * beta / 10\n  };\n}",
        explanation:
          "This module calculates a market risk score by multiplying volatility by beta and scaling the result.",
      },
      {
        id: "risk-2",
        name: "Credit Risk",
        description: "Assesses credit-related risks",
        inputs: [
          { name: "defaultRate", type: "number", value: 2.5, unit: "%" },
          { name: "recoveryRate", type: "number", value: 40, unit: "%" },
        ],
        outputs: [{ name: "creditRiskScore", type: "number", unit: "score" }],
        code: "function assessCreditRisk(defaultRate, recoveryRate) {\n  return {\n    creditRiskScore: defaultRate * (100 - recoveryRate) / 100\n  };\n}",
        explanation:
          "This module calculates a credit risk score by multiplying the default rate by the loss given default (100% minus the recovery rate).",
      },
      {
        id: "risk-3",
        name: "Operational Risk",
        description: "Assesses operational risks",
        inputs: [
          { name: "processComplexity", type: "number", value: 7, unit: "score" },
          { name: "controlEffectiveness", type: "number", value: 6, unit: "score" },
        ],
        outputs: [{ name: "operationalRiskScore", type: "number", unit: "score" }],
        code: "function assessOperationalRisk(processComplexity, controlEffectiveness) {\n  return {\n    operationalRiskScore: processComplexity * (10 - controlEffectiveness) / 10\n  };\n}",
        explanation:
          "This module calculates an operational risk score by multiplying process complexity by the inverse of control effectiveness.",
      },
      {
        id: "risk-4",
        name: "Liquidity Risk",
        description: "Assesses liquidity risks",
        inputs: [
          { name: "currentRatio", type: "number", value: 1.5, unit: "ratio" },
          { name: "cashReserve", type: "number", value: 500, unit: "million USD" },
        ],
        outputs: [{ name: "liquidityRiskScore", type: "number", unit: "score" }],
        code: "function assessLiquidityRisk(currentRatio, cashReserve) {\n  return {\n    liquidityRiskScore: 10 - currentRatio * 5 - Math.log(cashReserve) / 2\n  };\n}",
        explanation:
          "This module calculates a liquidity risk score by subtracting factors related to the current ratio and cash reserves from a baseline score.",
      },
      {
        id: "risk-5",
        name: "Aggregate Risk",
        description: "Combines all risk assessments",
        inputs: [
          { name: "marketRisk", type: "number", value: 1.8, unit: "score" },
          { name: "creditRisk", type: "number", value: 1.5, unit: "score" },
          { name: "operationalRisk", type: "number", value: 2.1, unit: "score" },
          { name: "liquidityRisk", type: "number", value: 1.2, unit: "score" },
        ],
        outputs: [
          { name: "aggregateRiskScore", type: "number", unit: "score" },
          { name: "riskCategory", type: "string", unit: "" },
        ],
        code: "function aggregateRisk(marketRisk, creditRisk, operationalRisk, liquidityRisk) {\n  const score = marketRisk * 0.3 + creditRisk * 0.3 + operationalRisk * 0.2 + liquidityRisk * 0.2;\n  let category;\n  if (score < 1.5) category = 'Low';\n  else if (score < 2.5) category = 'Medium';\n  else category = 'High';\n  return {\n    aggregateRiskScore: score,\n    riskCategory: category\n  };\n}",
        explanation:
          "This module calculates an aggregate risk score by combining market, credit, operational, and liquidity risks with appropriate weights. It also assigns a risk category based on the score.",
      },
      {
        id: "risk-6",
        name: "Value at Risk (VaR) Calculator",
        description: "Calculates Value at Risk using Monte Carlo simulation",
        inputs: [
          { name: "portfolioValue", type: "number", value: 10000000, unit: "USD" },
          { name: "confidenceLevel", type: "number", value: 95, unit: "%" },
          { name: "timeHorizon", type: "number", value: 10, unit: "days" },
          { name: "volatility", type: "number", value: 15, unit: "%" },
        ],
        outputs: [
          { name: "valueAtRisk", type: "number", unit: "USD" },
          { name: "expectedShortfall", type: "number", unit: "USD" },
        ],
        code: "function calculateVaR(portfolioValue, confidenceLevel, timeHorizon, volatility) {\n  // Nonlinear VaR calculation using Monte Carlo simulation\n  const annualizedVol = volatility / 100;\n  const dailyVol = annualizedVol / Math.sqrt(252);\n  const timeScaledVol = dailyVol * Math.sqrt(timeHorizon);\n  \n  // Simplified Monte Carlo simulation\n  const simCount = 10000;\n  const returns = [];\n  \n  for (let i = 0; i < simCount; i++) {\n    // Generate random normal return\n    let u = 0, v = 0;\n    while (u === 0) u = Math.random();\n    while (v === 0) v = Math.random();\n    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);\n    \n    // Calculate portfolio return\n    const portfolioReturn = Math.exp(z * timeScaledVol - 0.5 * timeScaledVol * timeScaledVol) - 1;\n    returns.push(portfolioReturn * portfolioValue);\n  }\n  \n  // Sort returns to find VaR\n  returns.sort((a, b) => a - b);\n  const varIndex = Math.floor(simCount * (1 - confidenceLevel / 100));\n  const valueAtRisk = -returns[varIndex];\n  \n  // Calculate Expected Shortfall (average of losses beyond VaR)\n  let esSum = 0;\n  for (let i = 0; i < varIndex; i++) {\n    esSum += -returns[i];\n  }\n  const expectedShortfall = esSum / varIndex;\n  \n  return {\n    valueAtRisk: valueAtRisk,\n    expectedShortfall: expectedShortfall\n  };\n}",
        explanation:
          "This module calculates Value at Risk (VaR) using a Monte Carlo simulation, which is a nonlinear approach to estimating potential portfolio losses. It generates thousands of random scenarios based on the portfolio's volatility and determines the loss threshold at the specified confidence level.",
      },
      {
        id: "risk-7",
        name: "Stress Test Simulator",
        description: "Simulates portfolio performance under stress scenarios",
        inputs: [
          { name: "portfolioValue", type: "number", value: 10000000, unit: "USD" },
          { name: "equityAllocation", type: "number", value: 60, unit: "%" },
          { name: "bondAllocation", type: "number", value: 30, unit: "%" },
          { name: "cashAllocation", type: "number", value: 10, unit: "%" },
          { name: "stressLevel", type: "number", value: 3, unit: "score" },
        ],
        outputs: [
          { name: "stressedValue", type: "number", unit: "USD" },
          { name: "percentLoss", type: "number", unit: "%" },
          { name: "recoveryTime", type: "number", unit: "months" },
        ],
        code: "function stressTest(portfolioValue, equityAllocation, bondAllocation, cashAllocation, stressLevel) {\n  // Nonlinear stress test with exponential impact as stress increases\n  const equityImpact = -0.15 * Math.exp(stressLevel / 3); // Exponential loss for equities\n  const bondImpact = -0.05 * Math.pow(stressLevel, 1.5); // Polynomial loss for bonds\n  const cashImpact = -0.01 * stressLevel; // Linear loss for cash\n  \n  const equityValue = portfolioValue * (equityAllocation / 100);\n  const bondValue = portfolioValue * (bondAllocation / 100);\n  const cashValue = portfolioValue * (cashAllocation / 100);\n  \n  const stressedEquity = equityValue * (1 + equityImpact);\n  const stressedBonds = bondValue * (1 + bondImpact);\n  const stressedCash = cashValue * (1 + cashImpact);\n  \n  const stressedValue = stressedEquity + stressedBonds + stressedCash;\n  const percentLoss = (stressedValue - portfolioValue) / portfolioValue * 100;\n  \n  // Nonlinear recovery time calculation\n  const recoveryTime = 6 * Math.pow(Math.abs(percentLoss) / 10, 1.7);\n  \n  return {\n    stressedValue: stressedValue,\n    percentLoss: percentLoss,\n    recoveryTime: recoveryTime\n  };\n}",
        explanation:
          "This module simulates how a portfolio would perform under stress scenarios using nonlinear impact functions. Equities experience exponential losses as stress increases, bonds follow a polynomial pattern, and cash has a linear relationship. The recovery time is also calculated using a nonlinear power function.",
      },
    ],
  },
  {
    id: 4,
    name: "Market Analysis",
    status: "pending",
    lastRun: "Never",
    moduleCount: 4,
    modules: [
      {
        id: "market-1",
        name: "Market Segmentation",
        description: "Segments the market based on demographic and behavioral factors",
        inputs: [
          {
            name: "demographicData",
            type: "object",
            value: { age: 35, income: 75000, education: "college" },
            unit: "",
          },
          {
            name: "behavioralData",
            type: "object",
            value: { frequency: 2.5, loyalty: 0.7, engagement: 0.8 },
            unit: "",
          },
        ],
        outputs: [
          { name: "segmentId", type: "string", unit: "" },
          { name: "segmentScore", type: "number", unit: "score" },
        ],
        code: "function segmentMarket(demographicData, behavioralData) {\n  // Nonlinear segmentation using logistic function\n  const ageScore = 1 / (1 + Math.exp(-(demographicData.age - 40) / 10));\n  const incomeScore = 1 / (1 + Math.exp(-(demographicData.income - 60000) / 20000));\n  const educationScore = demographicData.education === 'college' ? 0.8 : 0.5;\n  \n  const frequencyScore = Math.tanh(behavioralData.frequency);\n  const loyaltyScore = Math.pow(behavioralData.loyalty, 2);\n  const engagementScore = behavioralData.engagement;\n  \n  const totalScore = (ageScore + incomeScore + educationScore) * 0.4 + \n                     (frequencyScore + loyaltyScore + engagementScore) * 0.6;\n  \n  let segmentId;\n  if (totalScore > 0.8) segmentId = 'Premium';\n  else if (totalScore > 0.6) segmentId = 'Standard';\n  else if (totalScore > 0.4) segmentId = 'Basic';\n  else segmentId = 'Minimal';\n  \n  return {\n    segmentId: segmentId,\n    segmentScore: totalScore\n  };\n}",
        explanation:
          "This module segments the market using nonlinear transformations of demographic and behavioral data. It applies logistic functions to age and income, and uses hyperbolic tangent and power functions for behavioral metrics to create a more realistic segmentation model.",
      },
      {
        id: "market-2",
        name: "Price Elasticity Calculator",
        description: "Calculates price elasticity of demand",
        inputs: [
          { name: "initialPrice", type: "number", value: 100, unit: "USD" },
          { name: "initialQuantity", type: "number", value: 1000, unit: "units" },
          { name: "priceChange", type: "number", value: 10, unit: "%" },
          { name: "luxuryFactor", type: "number", value: 0.5, unit: "score" },
        ],
        outputs: [
          { name: "elasticity", type: "number", unit: "" },
          { name: "projectedQuantity", type: "number", unit: "units" },
          { name: "revenueChange", type: "number", unit: "%" },
        ],
        code: "function calculateElasticity(initialPrice, initialQuantity, priceChange, luxuryFactor) {\n  // Nonlinear elasticity model with varying elasticity at different price points\n  const priceRatio = 1 + priceChange / 100;\n  const newPrice = initialPrice * priceRatio;\n  \n  // Base elasticity that changes nonlinearly with price\n  const baseElasticity = -1.2 * Math.pow(initialPrice / 100, 0.3);\n  \n  // Adjust elasticity based on luxury factor (higher = more inelastic)\n  const adjustedElasticity = baseElasticity * (1 - luxuryFactor * 0.5);\n  \n  // Calculate quantity change with nonlinear response\n  const quantityRatio = Math.pow(priceRatio, adjustedElasticity);\n  const newQuantity = initialQuantity * quantityRatio;\n  \n  // Calculate revenue change\n  const initialRevenue = initialPrice * initialQuantity;\n  const newRevenue = newPrice * newQuantity;\n  const revenueChange = (newRevenue - initialRevenue) / initialRevenue * 100;\n  \n  return {\n    elasticity: adjustedElasticity,\n    projectedQuantity: newQuantity,\n    revenueChange: revenueChange\n  };\n}",
        explanation:
          "This module calculates price elasticity of demand using a nonlinear model where elasticity itself varies with price levels and product characteristics. It incorporates a luxury factor that affects how elastic the demand is, and uses power functions to model the nonlinear relationship between price and quantity.",
      },
      {
        id: "market-3",
        name: "Diffusion Model",
        description: "Models product adoption using Bass diffusion model",
        inputs: [
          { name: "marketSize", type: "number", value: 1000000, unit: "customers" },
          { name: "innovationCoefficient", type: "number", value: 0.03, unit: "" },
          { name: "imitationCoefficient", type: "number", value: 0.38, unit: "" },
          { name: "timeHorizon", type: "number", value: 10, unit: "years" },
        ],
        outputs: [
          { name: "adoptionCurve", type: "object", unit: "array" },
          { name: "peakAdoptionTime", type: "number", unit: "years" },
          { name: "totalAdoption", type: "number", unit: "customers" },
        ],
        code: "function bassDiffusionModel(marketSize, innovationCoefficient, imitationCoefficient, timeHorizon) {\n  // Nonlinear Bass diffusion model for product adoption\n  const p = innovationCoefficient;\n  const q = imitationCoefficient;\n  const m = marketSize;\n  \n  const adoptionCurve = [];\n  let cumulativeAdopters = 0;\n  let peakAdoptionTime = 0;\n  let peakAdoptionRate = 0;\n  \n  for (let t = 0; t <= timeHorizon; t += 0.25) {\n    // Bass model equation (nonlinear differential equation)\n    const adoptionRate = (p + q * cumulativeAdopters / m) * (m - cumulativeAdopters);\n    \n    if (adoptionRate > peakAdoptionRate) {\n      peakAdoptionRate = adoptionRate;\n      peakAdoptionTime = t;\n    }\n    \n    adoptionCurve.push({\n      time: t,\n      adoptionRate: adoptionRate,\n      cumulativeAdopters: cumulativeAdopters\n    });\n    \n    // Update cumulative adopters\n    cumulativeAdopters += adoptionRate * 0.25; // Multiply by time step\n    if (cumulativeAdopters > m) cumulativeAdopters = m;\n  }\n  \n  return {\n    adoptionCurve: adoptionCurve,\n    peakAdoptionTime: peakAdoptionTime,\n    totalAdoption: cumulativeAdopters\n  };\n}",
        explanation:
          "This module implements the Bass diffusion model, a nonlinear differential equation model that describes how new products get adopted in a population. It accounts for both innovation (adoption due to external influences) and imitation (adoption due to internal influences) to generate an S-shaped adoption curve.",
      },
      {
        id: "market-4",
        name: "Conjoint Analysis",
        description: "Analyzes consumer preferences using conjoint analysis",
        inputs: [
          {
            name: "attributes",
            type: "object",
            value: { price: [100, 200, 300], features: ["basic", "premium", "deluxe"], brand: ["A", "B", "C"] },
            unit: "",
          },
          { name: "surveyData", type: "object", value: { respondents: 200, preferences: [] }, unit: "" },
        ],
        outputs: [
          { name: "attributeImportance", type: "object", unit: "" },
          { name: "partWorth", type: "object", unit: "" },
          { name: "optimalConfiguration", type: "object", unit: "" },
        ],
        code: 'function conjointAnalysis(attributes, surveyData) {\n  // Simplified nonlinear conjoint analysis\n  // In a real implementation, this would process actual survey data\n  \n  // Simulate part-worth utilities with nonlinear price sensitivity\n  const priceUtility = attributes.price.map(p => -Math.log(p / 50));\n  \n  // Feature utilities with diminishing returns\n  const featureValues = { "basic": 1, "premium": 2, "deluxe": 3 };\n  const featureUtility = attributes.features.map(f => Math.sqrt(featureValues[f]));\n  \n  // Brand utilities\n  const brandUtility = { "A": 0.8, "B": 1.0, "C": 0.7 };\n  \n  // Calculate attribute importance\n  const priceRange = Math.max(...priceUtility) - Math.min(...priceUtility);\n  const featureRange = Math.max(...featureUtility) - Math.min(...featureUtility);\n  const brandRange = Math.max(...Object.values(brandUtility)) - Math.min(...Object.values(brandUtility));\n  \n  const totalRange = priceRange + featureRange + brandRange;\n  const attributeImportance = {\n    price: priceRange / totalRange * 100,\n    features: featureRange / totalRange * 100,\n    brand: brandRange / totalRange * 100\n  };\n  \n  // Find optimal configuration\n  let maxUtility = -Infinity;\n  let optimalConfig = {};\n  \n  for (const price of attributes.price) {\n    for (const feature of attributes.features) {\n      for (const brand of attributes.brand) {\n        const utility = priceUtility[attributes.price.indexOf(price)] + \n                       featureUtility[attributes.features.indexOf(feature)] + \n                       brandUtility[brand];\n        \n        if (utility > maxUtility) {\n          maxUtility = utility;\n          optimalConfig = { price, feature, brand };\n        }\n      }\n    }\n  }\n  \n  return {\n    attributeImportance: attributeImportance,\n    partWorth: {\n      price: priceUtility,\n      features: featureUtility,\n      brand: brandUtility\n    },\n    optimalConfiguration: optimalConfig\n  };\n}',
        explanation:
          "This module performs conjoint analysis, a statistical technique used in market research to determine how people value different attributes of a product. It uses nonlinear utility functions like logarithmic price sensitivity and square root for features to model diminishing returns, creating a more realistic model of consumer preferences.",
      },
    ],
  },
  {
    id: 5,
    name: "Quarterly Reporting",
    status: "inactive",
    lastRun: "1 week ago",
    moduleCount: 6,
    modules: [],
  },
]

export function WorkflowList() {
  const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("info")
  const router = useRouter()
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "inactive":
      default:
        return "bg-gray-500"
    }
  }

  const getSelectedModule = () => {
    if (!selectedModule) return null

    for (const workflow of workflows) {
      const module = workflow.modules.find((m) => m.id === selectedModule)
      if (module) return module
    }

    return null
  }

  const handleWorkflowClick = (workflowId: number) => {
    if (expandedWorkflow === workflowId) {
      setExpandedWorkflow(null)
    } else {
      setExpandedWorkflow(workflowId)
      toast({
        title: "Workflow Selected",
        description: `Viewing modules for ${workflows.find((w) => w.id === workflowId)?.name}`,
        duration: 3000,
      })
    }
  }

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(moduleId)
    // For a full implementation, navigate to the module details page
    // router.push(`/module-details/${moduleId}`)
  }

  const module = getSelectedModule()

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {workflows.map((workflow) => (
              <Collapsible
                key={workflow.id}
                open={expandedWorkflow === workflow.id}
                onOpenChange={() => handleWorkflowClick(workflow.id)}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-auto p-3 text-left">
                        <div className="flex flex-col w-full">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {expandedWorkflow === workflow.id ? (
                                <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
                              )}
                              <span className="font-medium">{workflow.name}</span>
                            </div>
                            <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
                          </div>
                          <div className="flex justify-between mt-1 pl-5">
                            <span className="text-xs text-muted-foreground">{workflow.moduleCount} modules</span>
                            <span className="text-xs text-muted-foreground">{workflow.lastRun}</span>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Click to expand workflow modules</p>
                  </TooltipContent>
                </Tooltip>
                <CollapsibleContent>
                  <div className="pl-5 pr-2 py-2 space-y-1">
                    {workflow.modules.length > 0 ? (
                      workflow.modules.map((module) => (
                        <Tooltip key={module.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedModule === module.id ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-left"
                              onClick={() => handleModuleClick(module.id)}
                            >
                              <div className="truncate">{module.name}</div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{module.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground py-1 px-2">No modules available</div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </TooltipProvider>

      {module && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">{module.name}</h3>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    toast({
                      title: "Module Executed",
                      description: `Running ${module.name}...`,
                      duration: 3000,
                    })
                  }}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    router.push(`/module-details/${module.id}`)
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                  <Info className="h-4 w-4 mr-1" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="inputs">
                  <Settings className="h-4 w-4 mr-1" />
                  I/O
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-2">
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">{module.description}</p>
                  <h4 className="font-medium mt-2 mb-1">Explanation:</h4>
                  <p className="text-muted-foreground text-xs">{module.explanation}</p>
                </div>
              </TabsContent>

              <TabsContent value="code" className="mt-2">
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[200px]">
                  <code>{module.code}</code>
                </pre>
              </TabsContent>

              <TabsContent value="inputs" className="mt-2">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Inputs:</h4>
                    <div className="space-y-2">
                      {module.inputs.map((input) => (
                        <div key={input.name} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{input.name}:</span>
                          <div className="flex items-center">
                            <Input value={input.value} className="h-6 w-20 text-xs" onChange={() => {}} />
                            <span className="ml-1 text-muted-foreground">{input.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Outputs:</h4>
                    <div className="space-y-1">
                      {module.outputs.map((output) => (
                        <div key={output.name} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{output.name}:</span>
                          <span>{output.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Module Executed",
                          description: `Running ${module.name} with custom inputs...`,
                          duration: 3000,
                        })
                      }}
                    >
                      Run Module
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
