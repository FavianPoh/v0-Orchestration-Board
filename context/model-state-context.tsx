"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import { createContext, useContext } from "react"
import { initialModelGroups } from "@/data/initial-model-groups"

// Define run lifecycle states
export type RunState = "IDLE" | "INITIATED" | "RUNNING" | "MAIN_COMPLETE" | "ADJUSTMENTS" | "FINALIZED"

type ModelStateContextType = {
  modelGroups: any[]
  updateModelGroup: (modelId: string, updates: any) => void
  updateModuleInGroup: (modelId: string, moduleId: string, updates: any) => void
  getModelById: (modelId: string) => any
  getModuleById: (moduleId: string) => any
  resetOutputs: () => void
  forceCompleteModule: (modelId: string, moduleId: string) => void
  forceCompleteAllRunning: () => void
  runModel: (modelId: string) => void
  runModule: (modelId: string, moduleId: string) => void
  toggleModelEnabled: (modelId: string) => void
  toggleModuleEnabled: (modelId: string, moduleId: string) => void
  toggleBreakpoint: (modelId: string) => void
  toggleModuleBreakpoint: (modelId: string, moduleId: string) => void
  getExecutionSequence: () => any[]
  getParallelExecutionGroups: () => any[][]
  getExecutionOrder: () => string[]
  updateExecutionOrder: (newOrder: string[]) => void
  updateModuleExecutionOrder: (modelId: string, newOrder: string[]) => void
  addTestModels: () => void
  isSimulationRunning: () => boolean
  runAllModels: (parallel: boolean) => void
  pauseExecution: () => void
  resumeExecution: () => boolean
  isSimulationPaused: () => boolean
  getCurrentRunningModels: () => string[]
  getPausedOnModel: () => string | null
  getFailedModel: () => string | null
  getModelDependencies: (modelId: string) => string[]
  getModelDependents: (modelId: string) => string[]
  continueAfterBreakpoint: (modelId: string) => void
  continueAfterModuleBreakpoint: (modelId: string, moduleId: string) => void
  debugModelDependencyStatus: (modelId: string) => void
  debugAllModelsState: () => void
  debugDependencyChain: (modelId: string, targetId: string) => { path: string[]; found: boolean }
  forceCompleteModel: (modelId: string) => void
  getRunId: () => string | null
  getRunStartTime: () => number | null
  getRunDuration: () => number
  getIterationCount: () => number
  incrementIterationCount: () => void
  getRunEndTime: () => number | null
  getRunMetadata: (runId?: string | null) => any | null
  getRunHistory: () => any[]
  getLastCompletedRunId: () => string | null
  prepareToRunModel: (modelId: string) => boolean
  checkAndRunFinancialModels: () => boolean
  verifyModelCompletionState: () => boolean
  canModelRun: (modelId: string) => boolean
  completeModel: (modelId: string) => void
  resetModelState: (modelId: string) => void
  debugModelState: (modelId: string) => void
  verifyRunCompletionStatus: () => boolean
  // New functions for Phase 1
  getRunState: () => RunState
  transitionToAdjustmentsPhase: () => void
  finalizeRun: () => void
  toggleModelFrozen: (modelId: string) => void
  isModelFrozen: (modelId: string) => boolean
  getFrozenModels: () => string[]
  canModelBeFrozen: (modelId: string) => boolean
  isDormant: () => boolean
  forceDormantState: () => void
  completeAllExecution: () => boolean
  simulationState: any
}

const ModelStateContext = createContext<ModelStateContextType | undefined>(undefined)

// Define the execution order based on the screenshot - ensure Scenario Expansion is first
const INITIAL_EXECUTION_ORDER = [
  "test-model-1", // Test models should be first
  "test-model-2",
  "test-model-3",
  "scenario-expansion", // This should be after test models
  "economic-models",
  "market-models",
  "balance-sheet-models",
  "risk-models",
  "capital-models",
  "financial-models",
  "credit-review",
]

// Helper function to ensure we're working with a Set
const ensureSet = (value: any): Set<string> => {
  if (value instanceof Set) return value
  if (Array.isArray(value)) return new Set(value)
  return new Set()
}

export function useModelState(): ModelStateContextType {
  const context = useContext(ModelStateContext)
  if (!context) {
    throw new Error("useModelState must be used within a ModelStateProvider")
  }
  return context
}

export function ModelStateProvider({ children }: { children: React.ReactNode }) {
  const [modelGroups, setModelGroups] = useState<any[]>([...initialModelGroups])
  const [executionOrder, setExecutionOrder] = useState<string[]>([...INITIAL_EXECUTION_ORDER])
  const [simulationState, setSimulationState] = useState({
    running: false,
    paused: false,
    pausedOnModel: null,
    pausedOnModule: null,
    failedModel: null,
    breakpointModels: new Set(),
    breakpointModules: new Set(),
    runId: null,
    runStartTime: null,
    runEndTime: null,
    iterationCount: 0,
    completedModels: new Set(),
    completedRuns: [],
    lastCompletedRunId: null,
    // New state for Phase 1
    runState: "IDLE" as RunState,
    frozenModels: new Set<string>(),
    // Add dormant flag to prevent loops
    dormant: true,
  })

  // Use refs to cache execution sequences to prevent excessive recalculations
  const executionSequenceCache = useRef<any[]>([])
  const parallelGroupsCache = useRef<any[][]>([])
  const executionSequenceDirty = useRef(true)

  // Refs for tracking execution state
  const runningModelsRef = useRef<Set<string>>(new Set())
  const runningModulesRef = useRef<Set<string>>(new Set())
  const completedModelsRef = useRef<Set<string>>(new Set())
  const processedModelsRef = useRef<Set<string>>(new Set())
  const currentExecutionRef = useRef<{
    parallel: boolean
    currentIndex: number
    sequence: any[]
    parallelGroups: any[][]
    breakpointModels: Set<string>
    breakpointModules: Set<string>
    pausedModels: Set<string>
    pausedModules: Set<string>
    processedModels: Set<string>
    processedModules: Set<string>
    dependencyMap: Map<string, string[]>
    verifying: boolean
    lastRebuildTime?: number
    rebuildLocked: boolean // Add this property
  }>({
    parallel: false,
    currentIndex: 0,
    sequence: [],
    parallelGroups: [],
    breakpointModels: new Set(),
    breakpointModules: new Set(),
    pausedModels: new Set(),
    pausedModules: new Set(),
    processedModels: new Set(),
    processedModules: new Set(),
    dependencyMap: new Map(),
    verifying: false,
    rebuildLocked: false,
  })

  const timeoutsRef = useRef(new Map())

  // Create a ref to store all functions to avoid circular dependencies
  const functionsRef = useRef<any>({})

  // Basic utility functions
  function updateModelGroup(modelId: string, updates: any) {
    setModelGroups((prevGroups) => prevGroups.map((model) => (model.id === modelId ? { ...model, ...updates } : model)))
    executionSequenceDirty.current = true // Mark cache as dirty when updating a model
  }

  function updateModuleInGroup(modelId: string, moduleId: string, updates: any) {
    setModelGroups((prevGroups) =>
      prevGroups.map((model) => {
        if (model.id === modelId && model.modules) {
          const updatedModules = model.modules.map((module) =>
            module.id === moduleId ? { ...module, ...updates } : module,
          )
          return { ...model, modules: updatedModules }
        }
        return model
      }),
    )
  }

  function getModelById(modelId: string) {
    return modelGroups.find((model) => model.id === modelId)
  }

  function getModuleById(moduleId: string) {
    for (const model of modelGroups) {
      if (model.modules) {
        const module = model.modules.find((m) => m.id === moduleId)
        if (module) {
          return { module, modelGroup: model }
        }
      }
    }
    return null
  }

  // Get the current execution order
  function getExecutionOrder() {
    return executionOrder
  }

  // Update the execution order
  function updateExecutionOrder(newOrder: string[]) {
    setExecutionOrder(newOrder)
    executionSequenceDirty.current = true // Mark cache as dirty when updating execution order
  }

  // Update the module execution order for a specific model
  function updateModuleExecutionOrder(modelId: string, newOrder: string[]) {
    setModelGroups((prevGroups) =>
      prevGroups.map((model) => {
        if (model.id === modelId) {
          return { ...model, moduleExecutionOrder: newOrder }
        }
        return model
      }),
    )
  }

  // Find the getExecutionSequence function and replace it with this version
  function getExecutionSequence() {
    // CRITICAL: In dormant state, return the cached sequence if available
    if (simulationState.dormant) {
      // Only log if we're actually rebuilding
      if (executionSequenceCache.current.length > 0) {
        // Removed excessive logging here
        return executionSequenceCache.current
      }
      // Only log once when building for the first time
      console.log("Building execution sequence for the first time in dormant state")
    }

    // Check if rebuilding is locked to prevent concurrent rebuilds
    if (currentExecutionRef.current.rebuildLocked) {
      console.log("Rebuild is locked, returning cached sequence")
      return executionSequenceCache.current.length > 0 ? executionSequenceCache.current : []
    }

    // Strict throttling to prevent excessive rebuilds - 3 seconds minimum between rebuilds
    const now = Date.now()
    if (
      currentExecutionRef.current.lastRebuildTime &&
      now - currentExecutionRef.current.lastRebuildTime < 3000 && // Increase to 3000ms
      executionSequenceCache.current.length > 0 &&
      !executionSequenceDirty.current
    ) {
      return executionSequenceCache.current
    }

    // Lock rebuilding and update timestamp
    currentExecutionRef.current.rebuildLocked = true
    currentExecutionRef.current.lastRebuildTime = now

    try {
      console.log("Rebuilding execution sequence")

      // Get all enabled models
      const enabledModels = modelGroups.filter((m) => m.enabled)

      // Create a map for quick model lookup
      const modelMap = new Map()
      enabledModels.forEach((model) => {
        modelMap.set(model.id, model)
      })

      // Create a map of model IDs to their position in executionOrder for tiebreaking
      const orderMap = new Map<string, number>()
      executionOrder.forEach((id, index) => {
        orderMap.set(id, index)
      })

      // Build dependency graph
      const graph = new Map<string, string[]>()
      enabledModels.forEach((model) => {
        graph.set(model.id, model.dependencies?.filter((depId) => enabledModels.some((m) => m.id === depId)) || [])
      })

      // Topological sort with tiebreaking by execution order
      const visited = new Set<string>()
      const temp = new Set<string>()
      const result: any[] = []

      function visit(modelId: string) {
        if (visited.has(modelId)) return
        if (temp.has(modelId)) {
          console.warn(`Circular dependency detected involving model ${modelId}`)
          return
        }

        temp.add(modelId)

        const dependencies = graph.get(modelId) || []
        const sortedDeps = [...dependencies].sort((a, b) => {
          const orderA = orderMap.has(a) ? orderMap.get(a)! : Number.MAX_SAFE_INTEGER
          const orderB = orderMap.has(b) ? orderMap.get(b)! : Number.MAX_SAFE_INTEGER
          return orderA - orderB
        })

        for (const depId of sortedDeps) {
          visit(depId)
        }

        temp.delete(modelId)
        visited.add(modelId)

        const model = modelMap.get(modelId)
        if (model) {
          result.push(model)
        }
      }

      // Process all models in execution order
      const sortedModelIds = enabledModels
        .map((model) => model.id)
        .sort((a, b) => {
          const orderA = orderMap.has(a) ? orderMap.get(a)! : Number.MAX_SAFE_INTEGER
          const orderB = orderMap.has(b) ? orderMap.get(b)! : Number.MAX_SAFE_INTEGER
          return orderA - orderB
        })

      for (const modelId of sortedModelIds) {
        if (!visited.has(modelId)) {
          visit(modelId)
        }
      }

      // Store dependency map for later use
      const dependencyMap = new Map<string, string[]>()
      enabledModels.forEach((model) => {
        dependencyMap.set(model.id, model.dependencies || [])
      })
      currentExecutionRef.current.dependencyMap = dependencyMap

      // Cache the result
      executionSequenceCache.current = result
      executionSequenceDirty.current = false

      return result
    } finally {
      // Always unlock rebuilding when done
      currentExecutionRef.current.rebuildLocked = false
    }
  }

  // Find the getParallelExecutionGroups function and replace it with this version
  function getParallelExecutionGroups() {
    // Use cached groups if available and not dirty, with strict conditions
    if (
      parallelGroupsCache.current.length > 0 &&
      !executionSequenceDirty.current &&
      currentExecutionRef.current.lastRebuildTime &&
      Date.now() - currentExecutionRef.current.lastRebuildTime < 3000
    ) {
      return parallelGroupsCache.current
    }

    // If we're in dormant state and have cached groups, use them
    if (simulationState.dormant && parallelGroupsCache.current.length > 0) {
      // Removed excessive logging
      return parallelGroupsCache.current
    }

    // If we're in dormant state with no cached groups, build them once
    if (simulationState.dormant && parallelGroupsCache.current.length === 0) {
      console.log("Building parallel groups for the first time in dormant state")
    }

    const enabledModels = modelGroups.filter((m) => m.enabled)
    const groups = []
    const processed = new Set()

    // Build dependency map if not already built
    if (currentExecutionRef.current.dependencyMap.size === 0) {
      const dependencyMap = new Map<string, string[]>()
      enabledModels.forEach((model) => {
        dependencyMap.set(model.id, model.dependencies || [])
      })
      currentExecutionRef.current.dependencyMap = dependencyMap
    }

    // First group: models with no dependencies
    const noDependencyModels = enabledModels.filter((model) => !model.dependencies || model.dependencies.length === 0)

    if (noDependencyModels.length > 0) {
      groups.push(noDependencyModels)
      noDependencyModels.forEach((model) => processed.add(model.id))
    }

    // Helper function to check if all dependencies of a model are in processed set
    const canProcess = (model) => {
      if (!model.dependencies || model.dependencies.length === 0) return true
      return model.dependencies.every((depId) => processed.has(depId))
    }

    // Process remaining models level by level
    while (processed.size < enabledModels.length) {
      // Find all models that can be processed in this level
      const levelModels = enabledModels.filter((model) => !processed.has(model.id) && canProcess(model))

      if (levelModels.length === 0) {
        // If we can't process any more models but haven't processed all,
        // there might be a circular dependency or missing dependency
        console.warn("⚠️ Possible circular dependency detected in models")

        // Add remaining models to ensure all models are included
        const remainingModels = enabledModels.filter((model) => !processed.has(model.id))
        if (remainingModels.length > 0) {
          groups.push(remainingModels)
          remainingModels.forEach((model) => processed.add(model.id))
        }
        break
      }

      // Add this level to groups
      groups.push(levelModels)

      // Mark these models as processed
      levelModels.forEach((model) => processed.add(model.id))
    }

    // Cache the result with timestamp
    parallelGroupsCache.current = groups
    if (!currentExecutionRef.current.lastRebuildTime) {
      currentExecutionRef.current.lastRebuildTime = Date.now()
    }

    return groups
  }

  // Get model dependencies
  function getModelDependencies(modelId: string) {
    const model = getModelById(modelId)
    return model?.dependencies || []
  }

  // Get models that depend on a specific model
  function getModelDependents(modelId: string) {
    const dependents = []
    modelGroups.forEach((model) => {
      if (model.dependencies && model.dependencies.includes(modelId)) {
        dependents.push(model.id)
      }
    })
    return dependents
  }

  // Function to check if simulation is running
  function isSimulationRunning() {
    return simulationState.running
  }

  // Function to check if simulation is paused
  function isSimulationPaused() {
    return simulationState.paused
  }

  // Function to get currently running models
  function getCurrentRunningModels() {
    return Array.from(runningModelsRef.current)
  }

  // Function to get the model that caused a pause
  function getPausedOnModel() {
    return simulationState.pausedOnModel
  }

  // Function to get the model that failed
  function getFailedModel() {
    return simulationState.failedModel
  }

  // Function to get the current run ID
  function getRunId() {
    return simulationState.runId
  }

  // Function to get the run start time
  function getRunStartTime() {
    return simulationState.runStartTime
  }

  // Function to get the run duration in seconds
  function getRunDuration() {
    if (!simulationState.runStartTime) return 0

    // If the run is finalized, use the end time for a fixed duration
    if (simulationState.runState === "FINALIZED" && simulationState.runEndTime) {
      return Math.floor((simulationState.runEndTime - simulationState.runStartTime) / 1000)
    }

    // Otherwise, calculate the current duration
    return Math.floor((Date.now() - simulationState.runStartTime) / 1000)
  }

  // Function to get the current iteration count
  function getIterationCount() {
    return simulationState.iterationCount
  }

  // Function to increment the iteration count
  function incrementIterationCount() {
    setSimulationState((prev) => ({
      ...prev,
      iterationCount: prev.iterationCount + 1,
    }))
  }

  // Function to get the current run end time
  function getRunEndTime() {
    return simulationState.runEndTime
  }

  // Function to get the run metadata
  function getRunMetadata(runId = null) {
    if (!runId && !simulationState.runId && !simulationState.lastCompletedRunId) {
      return null
    }

    const targetRunId = runId || simulationState.runId || simulationState.lastCompletedRunId

    // If it's the current active run
    if (simulationState.runId === targetRunId) {
      return {
        runId: simulationState.runId,
        startTime: simulationState.runStartTime,
        endTime: null,
        iterationCount: simulationState.iterationCount,
        isActive: true,
        isPaused: simulationState.paused,
        completedModelCount: simulationState.completedModels.size,
        totalModelCount: getExecutionSequence().length,
        runState: simulationState.runState,
        frozenModels: Array.from(simulationState.frozenModels),
      }
    }

    // Check in completed runs
    const completedRun = simulationState.completedRuns.find((run) => run.runId === targetRunId)
    if (completedRun) {
      return {
        ...completedRun,
        isActive: false,
        isPaused: false,
      }
    }

    return null
  }

  // Function to get all run history
  function getRunHistory() {
    return simulationState.completedRuns
  }

  // Function to get the last completed run ID
  function getLastCompletedRunId() {
    return simulationState.lastCompletedRunId
  }

  // Function to pause execution
  function pauseExecution() {
    console.log("Pausing execution")

    // Cancel all pending model completions
    if (timeoutsRef.current) {
      timeoutsRef.current.forEach((timeout, key) => {
        if (key.includes("-completion")) {
          if (typeof timeout === "number") {
            clearTimeout(timeout)
          }
          console.log(`Cancelled pending completion for ${key.split("-")[0]} due to pause`)
        }
      })
    }

    // Update simulation state
    setSimulationState((prev) => ({
      ...prev,
      paused: true,
    }))

    console.log("Execution paused")
  }

  // Function to check if a model can run based on its dependencies
  function canModelRun(modelId: string) {
    const model = getModelById(modelId)
    if (!model) {
      console.log(`Model ${modelId} not found`)
      return false
    }

    // Special debugging for scenario-expansion
    if (modelId === "scenario-expansion") {
      debugModelState(modelId)
    }

    // If model is not enabled, it can't run
    if (!model.enabled) {
      console.log(`Model ${modelId} is not enabled`)
      return false
    }

    // If model is already running, it can't run again
    if (model.status === "running") {
      console.log(`Model ${modelId} is already running`)
      return false
    }

    // If model is frozen, it can't run
    if (isModelFrozen(modelId)) {
      console.log(`Model ${modelId} is frozen and cannot run`)
      return false
    }

    // If model is already completed, it can't run again
    // For scenario-expansion, we'll add extra checks
    if (modelId === "scenario-expansion" && model.status === "completed") {
      console.log(`WARNING: scenario-expansion is marked as completed in model state`)
      // Force reset the status for scenario-expansion
      updateModelGroup(modelId, { status: "idle" })
      console.log(`Reset scenario-expansion status to idle`)
    } else if (model.status === "completed") {
      console.log(`Model ${modelId} is already completed`)
      return false
    }

    // If model is already completed, it can't run again
    if (completedModelsRef.current.has(modelId)) {
      console.log(`Model ${modelId} is already completed`)
      return false
    }

    // If model has no dependencies, it can run
    if (!model.dependencies || model.dependencies.length === 0) {
      console.log(`Model ${modelId} has no dependencies, can run`)
      return true
    }

    // Check if all dependencies are completed
    const allDependenciesCompleted = model.dependencies.every((depId) => {
      const depModel = getModelById(depId)

      // Check if this direct dependency has a breakpoint that's active
      const isDirectlyPaused = currentExecutionRef.current.pausedModels.has(depId)
      if (isDirectlyPaused) {
        console.log(`Direct dependency ${depId} for model ${modelId} is paused at a breakpoint`)
        // Update the model with blocking dependency info for UI
        if (depModel) {
          updateModelGroup(modelId, {
            status: "blocked",
            blockingDependencyId: depId,
            blockingDependencyName: `${depModel.name} (Paused at breakpoint)`,
          })
        }
        return false
      }

      // Standard completion checks
      const isInCompletedModels = completedModelsRef.current.has(depId)
      const isInProcessedModels = processedModelsRef.current.has(depId)
      const isInSimulationState = ensureSet(simulationState.completedModels).has(depId)
      const isInCurrentExecution = ensureSet(currentExecutionRef.current.processedModels).has(depId)
      const isCompletedInModel = depModel && depModel.status === "completed"
      const isFrozen = isModelFrozen(depId)

      // A frozen model counts as completed for dependency purposes
      const isCompleted =
        isInCompletedModels ||
        isInProcessedModels ||
        isInSimulationState ||
        isInCurrentExecution ||
        isCompletedInModel ||
        isFrozen

      if (!isCompleted) {
        console.log(`Dependency ${depId} for model ${modelId} is not completed`)
        // Update the model with blocking dependency info for UI
        if (depModel) {
          updateModelGroup(modelId, {
            status: "blocked",
            blockingDependencyId: depId,
            blockingDependencyName: depModel.name,
          })
        }
        return false
      }

      return true
    })

    if (allDependenciesCompleted) {
      console.log(`All dependencies for model ${modelId} are completed, can run`)
      // Clear any blocking status
      if (model.status === "blocked") {
        updateModelGroup(modelId, {
          status: "idle",
          blockingDependencyId: null,
          blockingDependencyName: null,
        })
      }
      return true
    } else {
      console.log(`Not all dependencies for model ${modelId} are completed, cannot run`)
      return false
    }
  }

  // Function to prepare a model for running
  function prepareToRunModel(modelId: string) {
    const model = getModelById(modelId)
    if (!model) {
      console.log(`Model ${modelId} not found`)
      return false
    }

    // If model is frozen, it can't run
    if (isModelFrozen(modelId)) {
      console.log(`Model ${modelId} is frozen and cannot run`)
      return false
    }

    // Special handling for scenario-expansion
    if (modelId === "scenario-expansion") {
      console.log("Special handling for scenario-expansion model")
      debugModelState(modelId)

      // Force reset scenario-expansion state
      if (
        model.status === "completed" ||
        completedModelsRef.current.has(modelId) ||
        processedModelsRef.current.has(modelId) ||
        currentExecutionRef.current.processedModels.has(modelId) ||
        ensureSet(simulationState.completedModels).has(modelId)
      ) {
        console.log("Forcing scenario-expansion state reset")

        // Update model status
        updateModelGroup(modelId, {
          status: "idle",
          progress: 0,
          startTime: null,
          endTime: null,
          executionTime: null,
          blockingDependencyId: null,
          blockingDependencyName: null,
        })

        // Remove from all tracking sets
        completedModelsRef.current.delete(modelId)
        processedModelsRef.current.delete(modelId)
        currentExecutionRef.current.processedModels.delete(modelId)

        // Update simulation state
        setSimulationState((prev) => {
          const completedModels = new Set(prev.completedModels)
          completedModels.delete(modelId)
          return { ...prev, completedModels }
        })

        console.log("scenario-expansion state reset complete")
        debugModelState(modelId)
      }
    }

    // Explicitly check if the model is already completed or running
    if (model.status === "completed") {
      console.log(`Model ${modelId} is already completed`)
      return false
    }

    if (model.status === "running") {
      console.log(`Model ${modelId} is already running`)
      return false
    }

    // Reset the model status to ensure it's not incorrectly marked as completed
    if (completedModelsRef.current.has(modelId)) {
      console.log(`Removing ${modelId} from completed models set as it's about to run`)
      completedModelsRef.current.delete(modelId)
    }

    if (processedModelsRef.current.has(modelId)) {
      console.log(`Removing ${modelId} from processed models set as it's about to run`)
      processedModelsRef.current.delete(modelId)
    }

    if (currentExecutionRef.current.processedModels.has(modelId)) {
      console.log(`Removing ${modelId} from current execution processed models set as it's about to run`)
      currentExecutionRef.current.processedModels.delete(modelId)
    }

    if (!canModelRun(modelId)) {
      console.log(`Cannot run model ${modelId} - dependencies not met or already running`)
      return false
    }

    // Update model status to running
    updateModelGroup(modelId, {
      status: "running",
      progress: 0,
      startTime: Date.now(),
      endTime: null,
    })

    // Add to running models set
    runningModelsRef.current.add(modelId)

    console.log(`Model ${modelId} prepared for running`)
    return true
  }

  // Function to end a simulation
  function endSimulation() {
    console.log("Ending simulation - cleaning up all state")

    // IMPORTANT: Remove the data attribute when simulation ends
    document.documentElement.removeAttribute("data-simulation-running")
    document.documentElement.removeAttribute("data-breakpoint-active")

    // Get the current run data
    const runId = simulationState.runId
    const startTime = simulationState.runStartTime
    const endTime = Date.now()
    const duration = startTime ? (endTime - startTime) / 1000 : 0
    const completedModelCount = simulationState.completedModels.size
    const totalModelCount = getExecutionSequence().length

    // Create a run record
    const runRecord = {
      runId,
      startTime,
      endTime,
      duration,
      completedModelCount,
      totalModelCount,
      iterationCount: simulationState.iterationCount,
      runState: simulationState.runState,
      frozenModels: Array.from(simulationState.frozenModels),
    }

    // Clear any pending timeouts
    if (timeoutsRef.current) {
      timeoutsRef.current.forEach((timeout) => {
        if (typeof timeout === "number") {
          clearTimeout(timeout)
        } else if (typeof timeout === "object") {
          clearInterval(timeout)
        }
      })
      timeoutsRef.current.clear()
    }

    // Reset execution refs
    runningModelsRef.current = new Set()
    runningModulesRef.current = new Set()
    currentExecutionRef.current.processedModels = new Set()
    currentExecutionRef.current.processedModules = new Set()
    currentExecutionRef.current.pausedModels = new Set()
    currentExecutionRef.current.pausedModules = new Set()

    // Reset the verifying flag
    currentExecutionRef.current.verifying = false

    // Update simulation state - use a callback to ensure we're working with the latest state
    setSimulationState((prev) => {
      console.log("Updating simulation state to completed")
      return {
        ...prev,
        running: false,
        paused: false,
        pausedOnModel: null,
        pausedOnModule: null,
        runId: null,
        runEndTime: endTime,
        lastCompletedRunId: runId,
        completedRuns: [...prev.completedRuns, runRecord],
        runState: "FINALIZED" as RunState,
        dormant: true, // Set dormant to true when ending simulation
      }
    })

    console.log(`Simulation ended. Duration: ${duration}s, Completed: ${completedModelCount}/${totalModelCount} models`)
  }

  // Function to run a model
  function runModel(modelId: string) {
    // If global execution is paused (not just a breakpoint), don't start new models
    if (simulationState.paused) {
      console.log(`Cannot run model ${modelId}: execution is globally paused`)
      return
    }

    // If there's an active breakpoint, check if this model depends on the paused model
    const activeBreakpointModel = document.documentElement.getAttribute("data-breakpoint-active")
    if (activeBreakpointModel !== null) {
      const model = getModelById(modelId)
      if (model && model.dependencies && model.dependencies.includes(activeBreakpointModel)) {
        console.log(`Cannot run model ${modelId}: depends on paused model ${activeBreakpointModel}`)
        return
      }
      // If the model doesn't depend on the paused model, it can still run
      console.log(`Model ${modelId} doesn't depend on paused model ${activeBreakpointModel}, allowing execution`)
    }

    if (!prepareToRunModel(modelId)) return

    const model = getModelById(modelId)
    if (!model) return

    console.log(`Running model ${modelId}`)

    // Simulate model running with a timeout
    const progressInterval = setInterval(() => {
      const currentProgress = model.progress || 0
      const newProgress = Math.min(currentProgress + 10, 99) // Increment by 10, but don't exceed 99
      updateModelGroup(modelId, { progress: newProgress })
    }, 500)

    // Simulate model completion after a delay
    const completionTimeout = setTimeout(
      () => {
        completeModel(modelId)
      },
      Math.random() * 5000 + 2000,
    ) // Random time between 2 and 7 seconds

    // Store timeouts for clearing later
    timeoutsRef.current.set(`${modelId}-progress`, progressInterval)
    timeoutsRef.current.set(`${modelId}-completion`, completionTimeout)
  }

  function checkAndRunDependentModels(modelId: string) {
    // Exit early if in dormant state
    if (simulationState.dormant) {
      console.log("Run is dormant, skipping dependent model checks")
      return
    }

    // Check if there's an active breakpoint
    const activeBreakpoint = document.documentElement.getAttribute("data-breakpoint-active")
    if (activeBreakpoint) {
      console.log(`Breakpoint active on model ${activeBreakpoint}, checking for non-dependent models that can run`)
      // Instead of returning, we'll continue but only run models that don't depend on the paused model
    }

    // Check if simulation is paused (separate from breakpoint)
    if (simulationState.paused) {
      console.log("Simulation is paused, skipping dependent model execution")
      return
    }

    // Check if simulation is running using the data attribute
    const isRunning = document.documentElement.getAttribute("data-simulation-running") === "true"

    // If the simulation is no longer running, don't start new models
    if (!isRunning) {
      console.log("Simulation is not running (checked via data attribute), skipping dependent model execution")
      return
    }

    console.log(`Checking for next models to run after completion of ${modelId}`)

    if (currentExecutionRef.current.parallel) {
      // PARALLEL EXECUTION MODE
      console.log("In parallel mode, checking all models that can run now")

      // Get all models that are not running or completed
      const pendingModels = modelGroups.filter(
        (model) =>
          model.enabled && model.status !== "running" && model.status !== "completed" && !isModelFrozen(model.id),
      )

      console.log(`Found ${pendingModels.length} pending models to check in parallel mode`)

      // For parallel execution mode, update the check for each pending model:
      let startedCount = 0
      pendingModels.forEach((model) => {
        // Check if this model depends on any model with an active breakpoint
        const dependsOnBreakpointedModel = model.dependencies?.some((depId) =>
          currentExecutionRef.current.pausedModels.has(depId),
        )

        if (dependsOnBreakpointedModel) {
          console.log(`Model ${model.id} depends on a model with an active breakpoint, cannot run yet`)
          // Update model status to show it's blocked by a breakpoint
          updateModelGroup(model.id, {
            status: "blocked",
            blockingDependencyId: Array.from(currentExecutionRef.current.pausedModels).find((id) =>
              model.dependencies.includes(id),
            ),
            blockingDependencyName: "Paused at breakpoint",
          })
        } else if (canModelRun(model.id)) {
          console.log(`Running model ${model.id} in parallel mode`)
          runModel(model.id)
          startedCount++
        } else {
          console.log(`Model ${model.id} cannot run yet in parallel mode`)
        }
      })

      // This is the correct implementation, but we need to make sure it's being used properly
      // No changes needed to this section, as it already checks for dependencies on breakpointed models
    } else {
      // SEQUENTIAL EXECUTION MODE
      console.log("In sequential mode, finding next model to run")

      const sequence = getExecutionSequence()
      if (!sequence || sequence.length === 0) {
        console.log("No sequence available for sequential execution")
        return
      }

      // Find the index of the completed model
      const completedIndex = sequence.findIndex((model) => model.id === modelId)
      if (completedIndex === -1) {
        console.log(`Model ${modelId} not found in sequence`)
        return
      }

      console.log(`Completed model index in sequence: ${completedIndex}`)
      let foundModelToRun = false

      // Find the next model that can run
      for (let i = completedIndex + 1; i < sequence.length; i++) {
        const nextModel = sequence[i]
        console.log(`Checking if next model ${nextModel.id} can run`)

        if (nextModel.status === "completed") {
          console.log(`Model ${nextModel.id} is already completed, skipping`)
          continue
        }

        if (isModelFrozen(nextModel.id)) {
          console.log(`Model ${nextModel.id} is frozen, skipping`)
          continue
        }

        if (canModelRun(nextModel.id)) {
          console.log(`Running next model in sequence: ${nextModel.id}`)
          runModel(nextModel.id)
          foundModelToRun = true
          return // Only run one model at a time in sequential mode
        } else {
          console.log(`Next model ${nextModel.id} cannot run yet, dependencies not met`)
          debugModelDependencyStatus(nextModel.id)
        }
      }

      if (!foundModelToRun) {
        console.log("No more models can run in the sequence")

        // Check if all models are completed or stuck
        setTimeout(() => verifyRunCompletionStatus(), 1000)
      }
    }
  }

  // Function to complete a model after running
  function completeModel(modelId: string) {
    const model = getModelById(modelId)
    if (!model) {
      console.log(`Cannot complete model ${modelId}: model not found`)
      return
    }

    // SAFETY CHECK: If the model is already marked as completed, don't process it again
    if (model.status === "completed" && completedModelsRef.current.has(modelId)) {
      console.log(`Model ${modelId} is already completed, skipping redundant completion`)
      return
    }

    console.log(`Completing model ${modelId}`)

    const endTime = Date.now()
    const executionTime = model.startTime ? (endTime - model.startTime) / 1000 : null

    // Generate or update output values
    const updatedOutputs = model.outputs ? [...model.outputs] : []

    // For each output, store the previous value before updating
    updatedOutputs.forEach((output) => {
      // Store the previous value for change detection
      output.previousValue = output.value

      // Keep existing value if it's already set and not empty
      if (output.value !== null && output.value !== undefined && output.value !== "") {
        // Value already exists, just mark as changed
        output.changed = true
      } else {
        // If the output doesn't have a value yet, use the initial value or generate one
        if (output.value === null || output.value === undefined || output.value === "") {
          // First try to use the existing value as is
          if (typeof output.value === "string" && output.value !== "") {
            // Keep existing string value
          }
          // Next try to use the baseValue if available
          else if (output.baseValue !== undefined) {
            if (typeof output.baseValue === "number" || !isNaN(Number(output.baseValue))) {
              const baseValue = typeof output.baseValue === "number" ? output.baseValue : Number(output.baseValue)

              // Add some randomness to make it look realistic
              const fluctuation = (Math.random() - 0.5) * 0.2 * baseValue
              output.value = (baseValue + fluctuation).toFixed(2)
            } else {
              // For non-numeric baseValue
              output.value = output.baseValue
            }
          }
          // Finally, just use the value directly if it's a string or number
          else if (typeof output.value === "string" || typeof output.value === "number") {
            // Keep as is
          } else {
            // As a last resort for test models, use the name to create a predictable value
            if (model.id.startsWith("test-model")) {
              output.value = output.value || "42" // Test models should always have 42 as default
            } else {
              output.value = Math.round(Math.random() * 100).toString()
            }
          }
        }

        // Mark this output as changed
        output.changed = true
      }
    })

    // Update model status to completed with proper output values
    updateModelGroup(modelId, {
      status: "completed",
      progress: 100,
      endTime,
      executionTime,
      outputs: updatedOutputs,
    })

    // Show a toast notification with output values
    try {
      // Check if we have access to the toast function
      if (typeof window !== "undefined" && window.toast) {
        const updatedModel = getModelById(modelId)
        if (updatedModel) {
          let outputInfo = ""
          if (updatedModel.outputs && updatedModel.outputs.length > 0) {
            outputInfo = updatedModel.outputs
              .map((output) => {
                const changeIndicator = output.changed ? " 🔄" : ""
                return `${output.name}: ${output.value || "—"}${output.unit ? " " + output.unit : ""}${changeIndicator}`
              })
              .join("\n")
          }

          window.toast({
            title: `${updatedModel.name} completed`,
            description: outputInfo ? `Outputs:\n${outputInfo}` : "Model execution completed successfully",
            duration: 5000,
          })
        }
      }
    } catch (error) {
      console.error("Error showing toast notification:", error)
    }

    // Remove from running models set
    runningModelsRef.current.delete(modelId)

    // Add to completed models sets (multiple sources of truth for robustness)
    completedModelsRef.current.add(modelId)
    processedModelsRef.current.add(modelId)
    currentExecutionRef.current.processedModels.add(modelId)

    // Update simulation state with completed model
    setSimulationState((prev) => {
      const completedModels = new Set(prev.completedModels)
      completedModels.add(modelId)
      return { ...prev, completedModels }
    })

    console.log(
      `Model ${modelId} completed in ${executionTime !== null ? executionTime + "s" : "null (time calculation error)"}`,
    )

    // Ensure the model is properly marked as completed in all tracking mechanisms
    if (!completedModelsRef.current.has(modelId)) {
      console.log(`Force adding ${modelId} to completed models set`)
      completedModelsRef.current.add(modelId)
    }

    if (!processedModelsRef.current.has(modelId)) {
      console.log(`Force adding ${modelId} to processed models set`)
      processedModelsRef.current.add(modelId)
    }

    if (!currentExecutionRef.current.processedModels.has(modelId)) {
      console.log(`Force adding ${modelId} to current execution processed models set`)
      currentExecutionRef.current.processedModels.add(modelId)
    }

    console.log(`Model ${modelId} completed in ${executionTime}s`)

    // Check if this was the last model to complete
    const sequence = getExecutionSequence()
    const completedCount = sequence.filter((m) => m.status === "completed" || isModelFrozen(m.id) || !m.enabled).length
    const totalCount = sequence.length

    console.log(`Completion check: ${completedCount}/${totalCount} models completed or frozen`)

    if (completedCount === totalCount) {
      console.log("All models have completed or are frozen, ending simulation")

      // Immediately update the DOM attribute to prevent further execution
      document.documentElement.removeAttribute("data-simulation-running")
      console.log("Removed data-simulation-running attribute")

      // Force a dormant state
      simulationState.dormant = true

      // Update React state
      setSimulationState((prev) => ({
        ...prev,
        running: false,
        runState: "MAIN_COMPLETE" as RunState,
        dormant: true,
      }))
    }

    // Clear any timeouts for this model
    if (timeoutsRef.current) {
      const progressInterval = timeoutsRef.current.get(`${modelId}-progress`)
      const completionTimeout = timeoutsRef.current.get(`${modelId}-completion`)

      if (progressInterval) {
        clearInterval(progressInterval)
        timeoutsRef.current.delete(`${modelId}-progress`)
      }

      if (completionTimeout) {
        clearTimeout(completionTimeout)
        timeoutsRef.current.delete(`${modelId}-completion`)
      }
    }

    // Check if this model has a breakpoint
    if (model.breakpoint) {
      console.log(`Breakpoint hit on model ${modelId}`)

      // Mark which model caused the pause
      setSimulationState((prev) => ({
        ...prev,
        pausedOnModel: modelId,
        // Don't set paused: true here, as we only want to pause this specific model
      }))

      // Add to paused models set
      currentExecutionRef.current.pausedModels.add(modelId)

      // IMPORTANT: Set a data attribute to indicate a breakpoint is active
      document.documentElement.setAttribute("data-breakpoint-active", modelId)

      // Don't set dormant state here - we want non-dependent models to continue running

      console.log(`Execution paused at breakpoint on model ${modelId}`)

      // Continue checking for non-dependent models that can run
      setTimeout(() => checkAndRunDependentModels(modelId), 0)
      return // Don't continue execution for dependent models
    }

    // Check for dependent models only if we're still running
    const isRunning = document.documentElement.getAttribute("data-simulation-running") === "true"
    const isPaused = simulationState.paused || document.documentElement.getAttribute("data-breakpoint-active") !== null

    if (isRunning && !isPaused && !simulationState.dormant) {
      console.log(`Checking for models that can run after completion of ${modelId}`)
      // Use setTimeout with 0 delay to avoid stack overflow with deep chains
      setTimeout(() => checkAndRunDependentModels(modelId), 0)
    } else {
      console.log(`Skipping dependent model check - simulation is not running or is paused or dormant`)
    }
  }

  // Function to run a module
  function runModule(modelId: string, moduleId: string) {
    const model = getModelById(modelId)
    if (!model) return

    // If model is frozen, its modules can't run
    if (isModelFrozen(modelId)) {
      console.log(`Model ${modelId} is frozen, cannot run its module ${moduleId}`)
      return
    }

    const module = model.modules?.find((m) => m.id === moduleId)
    if (!module) return

    console.log(`Running module ${moduleId} in model ${modelId}`)

    // Update module status to running
    updateModuleInGroup(modelId, moduleId, { status: "running" })

    // Simulate module running with a timeout
    setTimeout(
      () => {
        // Simulate module completion
        updateModuleInGroup(modelId, moduleId, { status: "completed" })
        console.log(`Module ${moduleId} in model ${modelId} completed`)
      },
      Math.random() * 3000 + 1000,
    ) // Random time between 1 and 4 seconds
  }

  // Function to force complete a module
  function forceCompleteModule(modelId: string, moduleId: string) {
    const model = getModelById(modelId)
    if (!model) return

    // Simulate module completion
    updateModuleInGroup(modelId, moduleId, { status: "completed" })
    console.log(`Module ${moduleId} in model ${modelId} force completed`)
  }

  // Function to force complete a model
  function forceCompleteModel(modelId: string) {
    const model = getModelById(modelId)
    if (!model) return

    // Simulate model completion
    updateModelGroup(modelId, { status: "completed", progress: 100 })
    console.log(`Model ${modelId} force completed`)
  }

  // Function to force complete all running models and modules
  function forceCompleteAllRunning() {
    console.log("Force completing all running models and modules")

    // Force complete all running modules
    modelGroups.forEach((model) => {
      if (model.modules) {
        model.modules.forEach((module) => {
          if (module.status === "running") {
            forceCompleteModule(model.id, module.id)
          }
        })
      }
    })

    // Force complete all running models
    runningModelsRef.current.forEach((modelId) => {
      forceCompleteModel(modelId)
    })
  }

  // Function to resume execution after a breakpoint
  function resumeExecution() {
    console.log("Resuming execution")

    // Clear paused model
    setSimulationState((prev) => ({
      ...prev,
      paused: false,
      pausedOnModel: null,
    }))

    // Run the next model
    if (simulationState.pausedOnModel) {
      checkAndRunDependentModels(simulationState.pausedOnModel)
    }

    return true
  }

  // Function to continue execution after a breakpoint on a model
  function continueAfterBreakpoint(modelId: string) {
    console.log(`Continuing after breakpoint on model ${modelId}`)

    // Remove model from paused models set
    currentExecutionRef.current.pausedModels.delete(modelId)

    // Clear the breakpoint data attribute
    document.documentElement.removeAttribute("data-breakpoint-active")

    // Clear paused model state
    setSimulationState((prev) => ({
      ...prev,
      pausedOnModel: null,
    }))

    // Add a more explicit log to help with debugging
    console.log("Breakpoint cleared, document attribute removed, checking for models that can run")

    // Resume execution by checking for dependent models
    setTimeout(() => {
      // Ensure we're still in a running state
      if (document.documentElement.getAttribute("data-simulation-running") === "true") {
        // Mark the model as fully completed so its outputs can be used
        const model = getModelById(modelId)
        if (model) {
          // Make sure the model is marked as completed in all tracking sets
          completedModelsRef.current.add(modelId)
          processedModelsRef.current.add(modelId)
          currentExecutionRef.current.processedModels.add(modelId)

          // Update simulation state with completed model
          setSimulationState((prev) => {
            const completedModels = new Set(prev.completedModels)
            completedModels.add(modelId)
            return { ...prev, completedModels }
          })
        }

        // Now check for models that can run
        checkAndRunDependentModels(modelId)
      } else {
        console.log("Cannot continue: simulation is no longer running")
      }
    }, 0)
  }

  // Function to continue execution after a breakpoint on a module
  function continueAfterModuleBreakpoint(modelId: string, moduleId: string) {
    console.log(`Continuing after breakpoint on module ${moduleId} in model ${modelId}`)

    // Remove module from paused modules set
    currentExecutionRef.current.pausedModules.delete(moduleId)

    // Resume execution
    resumeExecution()
  }

  // Function to run all models
  function runAllModels(parallel = false) {
    console.log(`Running all models ${parallel ? "in parallel" : "sequential"} mode`)

    // Reset outputs before running
    resetOutputs()

    // EXPLICIT: Set dormant to false immediately
    simulationState.dormant = false

    // Force rebuild the execution sequence
    executionSequenceDirty.current = true
    currentExecutionRef.current.lastRebuildTime = null

    // Get execution sequence or parallel groups with a single forced rebuild
    const sequence = getExecutionSequence()
    const parallelGroups = getParallelExecutionGroups()

    // Debug the sequence
    console.log("Execution sequence:", sequence.map((m) => m.id).join(", "))

    // Explicitly reset scenario-expansion model state
    const scenarioExpansionModel = getModelById("scenario-expansion")
    if (scenarioExpansionModel) {
      console.log("Explicitly resetting scenario-expansion model state")

      // Force update the model status directly
      updateModelGroup("scenario-expansion", {
        status: "idle",
        progress: 0,
        startTime: null,
        endTime: null,
        executionTime: null,
        blockingDependencyId: null,
        blockingDependencyName: null,
      })

      // Remove from all tracking sets
      completedModelsRef.current.delete("scenario-expansion")
      processedModelsRef.current.delete("scenario-expansion")
      runningModelsRef.current.delete("scenario-expansion")
      currentExecutionRef.current.processedModels.delete("scenario-expansion")

      // Debug the model state after reset
      debugModelState("scenario-expansion")
    }

    // IMPORTANT: Set a data attribute on the document to track simulation state
    // This is to overcome stale closure issues in React
    document.documentElement.setAttribute("data-simulation-running", "true")

    // Set simulation state to running
    setSimulationState((prev) => {
      return {
        ...prev,
        running: true,
        paused: false,
        pausedOnModel: null,
        pausedOnModule: null,
        failedModel: null,
        runId: Date.now().toString(),
        runStartTime: Date.now(),
        runEndTime: null,
        iterationCount: 0,
        completedModels: new Set(),
        runState: "INITIATED" as RunState,
        dormant: false, // Set dormant to false when starting a run
      }
    })

    // Reset execution refs
    runningModelsRef.current = new Set()
    runningModulesRef.current = new Set()
    completedModelsRef.current = new Set()
    processedModelsRef.current = new Set()
    currentExecutionRef.current = {
      ...currentExecutionRef.current,
      parallel,
      currentIndex: 0,
      sequence,
      parallelGroups,
      breakpointModels: new Set(),
      breakpointModules: new Set(),
      pausedModels: new Set(),
      pausedModules: new Set(),
      processedModels: new Set(),
      processedModules: new Set(),
      dependencyMap: new Map(),
      verifying: false, // Initialize verifying flag
      rebuildLocked: false,
    }

    // Update run state to RUNNING
    setTimeout(() => {
      setSimulationState((prev) => ({
        ...prev,
        runState: "RUNNING" as RunState,
      }))
    }, 500)

    // Run models based on parallel or sequential execution
    if (parallel) {
      // Run models in parallel groups
      if (parallelGroups.length > 0) {
        // Get the first group of models that can run in parallel
        const firstGroup = parallelGroups[0]
        console.log(
          `Starting parallel execution with ${firstGroup.length} models in first group: ${firstGroup.map((m) => m.id).join(", ")}`,
        )

        // Run all models in the first group
        firstGroup.forEach((model) => {
          console.log(`Starting model in parallel: ${model.id} (${model.name})`)
          runModel(model.id)
        })
      } else {
        console.log("No models to run in parallel mode")
      }
    } else {
      // Run models in sequence
      if (sequence.length > 0) {
        const firstModel = sequence[0]
        console.log(`Starting sequential execution with first model: ${firstModel.id} (${firstModel.name})`)
        runModel(firstModel.id)
      } else {
        console.log("No models to run in sequential mode")
      }
    }
  }

  // Function to add test models
  function addTestModels() {
    console.log("addTestModels called - checking for existing test models")

    // Check if test models already exist
    const testModelExists = modelGroups.some((model) => model.id.startsWith("test-model-"))
    if (testModelExists) {
      console.log("Test models already exist, not adding again")
      return
    }

    console.log("Creating test models...")

    try {
      // Create test models
      const testModels = [
        {
          id: "test-model-1",
          name: "Test Model 1",
          description: "A test model with no dependencies",
          status: "idle",
          progress: 0,
          enabled: true,
          frozen: false,
          breakpoint: false,
          priority: 5,
          executionTime: null,
          startTime: null,
          endTime: null,
          modules: [
            {
              id: "test-module-1-1",
              name: "Test Module 1.1",
              status: "idle",
              enabled: true,
              optional: false,
              description: "A test module in Test Model 1",
              inputs: [],
              outputs: [
                {
                  name: "Test Output 1",
                  value: "42",
                  unit: "",
                  description: "A test output",
                  consumers: ["Test Module 2.1"],
                },
              ],
              dependencies: [],
              dependents: ["test-module-2-1"],
            },
          ],
          outputs: [{ name: "Test Output", value: "42", unit: "" }],
          dependencies: [],
          dependents: ["test-model-2"],
          optional: false,
        },
        {
          id: "test-model-2",
          name: "Test Model 2",
          description: "A test model that depends on Test Model 1",
          status: "idle",
          progress: 0,
          enabled: true,
          frozen: false,
          breakpoint: false,
          priority: 4,
          executionTime: null,
          startTime: null,
          endTime: null,
          modules: [
            {
              id: "test-module-2-1",
              name: "Test Module 2.1",
              status: "idle",
              enabled: true,
              optional: false,
              description: "A test module in Test Model 2",
              inputs: [
                {
                  id: "test-input-2-1",
                  name: "Test Input",
                  description: "Input from Test Model 1",
                  type: "number",
                  value: 42,
                  min: 0,
                  max: 100,
                  step: 1,
                  unit: "",
                  source: "Test Module 1.1",
                },
              ],
              outputs: [
                {
                  name: "Test Output 2",
                  value: "84",
                  unit: "",
                  description: "A test output",
                  consumers: ["Test Module 3.1"],
                },
              ],
              dependencies: ["test-module-1-1"],
              dependents: ["test-module-3-1"],
            },
          ],
          outputs: [{ name: "Test Output", value: "84", unit: "" }],
          dependencies: ["test-model-1"],
          dependents: ["test-model-3"],
          optional: false,
        },
        {
          id: "test-model-3",
          name: "Test Model 3",
          description: "A test model that depends on Test Model 2",
          status: "idle",
          progress: 0,
          enabled: true,
          frozen: false,
          breakpoint: false,
          priority: 3,
          executionTime: null,
          startTime: null,
          endTime: null,
          modules: [
            {
              id: "test-module-3-1",
              name: "Test Module 3.1",
              status: "idle",
              enabled: true,
              optional: false,
              description: "A test module in Test Model 3",
              inputs: [
                {
                  id: "test-input-3-1",
                  name: "Test Input",
                  description: "Input from Test Model 2",
                  type: "number",
                  value: 84,
                  min: 0,
                  max: 200,
                  step: 1,
                  unit: "",
                  source: "Test Module 2.1",
                },
              ],
              outputs: [
                {
                  name: "Test Output 3",
                  value: "168",
                  unit: "",
                  description: "A test output",
                  consumers: [],
                },
              ],
              dependencies: ["test-module-2-1"],
              dependents: [],
            },
          ],
          outputs: [{ name: "Test Output", value: "168", unit: "" }],
          dependencies: ["test-model-2"],
          dependents: [],
          optional: false,
        },
      ]

      // Add test models to the beginning of the model groups
      setModelGroups((prevGroups) => {
        console.log(`Adding ${testModels.length} test models to ${prevGroups.length} existing models`)
        return [...testModels, ...prevGroups]
      })

      console.log("Test models added to state")

      // Update execution order to include test models
      setExecutionOrder((prevOrder) => {
        const newOrder = [...prevOrder]
        // Add test models to the beginning if they don't exist
        testModels.forEach((model) => {
          if (!newOrder.includes(model.id)) {
            newOrder.unshift(model.id)
          }
        })
        console.log(`Updated execution order with test models: ${newOrder.join(", ")}`)
        return newOrder
      })

      // Mark execution sequence as dirty
      executionSequenceDirty.current = true
      console.log("Test models successfully added")
    } catch (error) {
      console.error("Error adding test models:", error)
    }
  }

  // Function to reset all outputs
  function resetOutputs() {
    console.log("Resetting all outputs and state")

    // AGGRESSIVE CLEANUP - Force remove all DOM state attributes
    document.documentElement.removeAttribute("data-simulation-running")
    document.documentElement.removeAttribute("data-breakpoint-active")

    // Clear all timeouts and intervals immediately
    if (timeoutsRef.current) {
      timeoutsRef.current.forEach((timeout) => {
        if (typeof timeout === "number") {
          clearTimeout(timeout)
        } else if (typeof timeout === "object") {
          clearInterval(timeout)
        }
      })
      timeoutsRef.current.clear()
    }

    // Reset all models to idle state and clear outputs
    setModelGroups((prevGroups) =>
      prevGroups.map((model) => {
        // Reset model status
        const updatedModel = {
          ...model,
          status: "idle",
          progress: 0,
          startTime: null,
          endTime: null,
          executionTime: null,
          blockingDependencyId: null,
          blockingDependencyName: null,
        }

        // Clear model outputs - explicitly set to null or empty string
        if (updatedModel.outputs) {
          updatedModel.outputs = updatedModel.outputs.map((output) => ({
            ...output,
            value: null, // Set to null instead of empty string for clearer indication
            previousValue: output.value, // Store previous value for comparison
          }))
        }

        // Reset module statuses and clear module outputs if they exist
        if (model.modules) {
          updatedModel.modules = model.modules.map((module) => {
            const updatedModule = {
              ...module,
              status: "idle",
            }

            // Clear module outputs - explicitly set to null
            if (updatedModule.outputs) {
              updatedModule.outputs = updatedModule.outputs.map((output) => ({
                ...output,
                value: null, // Set to null instead of empty string
                previousValue: output.value, // Store previous value for comparison
              }))
            }

            return updatedModule
          })
        }

        return updatedModel
      }),
    )

    // CRITICAL: Force state reset immediately, don't wait for React state update
    simulationState.running = false
    simulationState.paused = false
    simulationState.pausedOnModel = null
    simulationState.pausedOnModule = null
    simulationState.failedModel = null
    simulationState.completedModels = new Set()
    simulationState.runState = "IDLE"
    simulationState.frozenModels = new Set()
    simulationState.dormant = true

    // Update simulation state to ensure React state is also updated
    setSimulationState((prev) => ({
      ...prev,
      running: false,
      paused: false,
      pausedOnModel: null,
      pausedOnModule: null,
      failedModel: null,
      completedModels: new Set(),
      runState: "IDLE" as RunState,
      frozenModels: new Set<string>(),
      dormant: true,
    }))

    // Reset all execution references
    runningModelsRef.current = new Set()
    runningModulesRef.current = new Set()
    completedModelsRef.current = new Set()
    processedModelsRef.current = new Set()
    currentExecutionRef.current.processedModels = new Set()
    currentExecutionRef.current.processedModules = new Set()
    currentExecutionRef.current.pausedModels = new Set()
    currentExecutionRef.current.pausedModules = new Set()

    // Reset the verifying flag
    currentExecutionRef.current.verifying = false

    // Reset execution sequence cache to force a clean rebuild
    executionSequenceCache.current = []
    parallelGroupsCache.current = []
    executionSequenceDirty.current = true
    currentExecutionRef.current.lastRebuildTime = null

    // Force a clean state
    console.log("All outputs and state reset completely")

    // Return to ensure consistent cleanup
    return true
  }

  // Function to toggle model enabled state
  function toggleModelEnabled(modelId: string) {
    const model = getModelById(modelId)
    if (!model) return

    updateModelGroup(modelId, { enabled: !model.enabled })
    console.log(`Model ${modelId} ${model.enabled ? "disabled" : "enabled"}`)

    // Mark execution sequence as dirty
    executionSequenceDirty.current = true
  }

  // Function to toggle module enabled state
  function toggleModuleEnabled(modelId: string, moduleId: string) {
    const model = getModelById(modelId)
    if (!model || !model.modules) return

    const module = model.modules.find((m) => m.id === moduleId)
    if (!module) return

    updateModuleInGroup(modelId, moduleId, { enabled: !module.enabled })
    console.log(`Module ${moduleId} ${module.enabled ? "disabled" : "enabled"}`)
  }

  // Function to toggle model breakpoint
  function toggleBreakpoint(modelId: string) {
    const model = getModelById(modelId)
    if (!model) return

    // Toggle the breakpoint state
    const newBreakpointState = !model.breakpoint

    // Update the model with the new breakpoint state and add a visual indicator
    updateModelGroup(modelId, {
      breakpoint: newBreakpointState,
      // Add a visual indicator for breakpoints
      breakpointActive: newBreakpointState,
    })

    console.log(`Breakpoint ${newBreakpointState ? "set on" : "removed from"} model ${modelId}`)

    // Update breakpoint models set
    const breakpointModels = new Set(currentExecutionRef.current.breakpointModels)
    if (!newBreakpointState) {
      breakpointModels.delete(modelId)
    } else {
      breakpointModels.add(modelId)

      // If we're setting a breakpoint and the model is already completed,
      // we need to show a toast notification to inform the user
      if (model.status === "completed") {
        try {
          if (typeof window !== "undefined" && window.toast) {
            window.toast({
              title: "Breakpoint set on completed model",
              description: "This breakpoint will be active the next time the model runs",
              duration: 5000,
            })
          }
        } catch (error) {
          console.error("Error showing toast notification:", error)
        }
      }
    }
    currentExecutionRef.current.breakpointModels = breakpointModels

    // Force a UI refresh by marking the execution sequence as dirty
    executionSequenceDirty.current = true
  }

  // Function to toggle module breakpoint
  function toggleModuleBreakpoint(modelId: string, moduleId: string) {
    const model = getModelById(modelId)
    if (!model || !model.modules) return

    const module = model.modules.find((m) => m.id === moduleId)
    if (!module) return

    updateModuleInGroup(modelId, moduleId, { breakpoint: !module.breakpoint })
    console.log(`Breakpoint ${module.breakpoint ? "removed from" : "set on"} module ${moduleId}`)

    // Update breakpoint modules set
    const breakpointModules = new Set(currentExecutionRef.current.breakpointModules)
    if (module.breakpoint) {
      breakpointModules.delete(moduleId)
    } else {
      breakpointModules.add(moduleId)
    }
    currentExecutionRef.current.breakpointModules = breakpointModules
  }

  // Function to debug model dependency status
  function debugModelDependencyStatus(modelId: string) {
    const model = getModelById(modelId)
    if (!model) return

    console.log(`Debugging dependency status for model ${modelId}`)
    console.log(`Dependencies: ${model.dependencies ? model.dependencies.join(", ") : "None"}`)

    if (model.dependencies) {
      model.dependencies.forEach((depId) => {
        const depModel = getModelById(depId)
        if (depModel) {
          console.log(`Dependency ${depId} status: ${depModel.status}`)
        } else {
          console.log(`Dependency ${depId} not found`)
        }
      })
    }
  }

  // Function to debug all models state
  function debugAllModelsState() {
    console.log("Debugging all models state")

    modelGroups.forEach((model) => {
      console.log(`Model ${model.id}:`)
      console.log(`  Name: ${model.name}`)
      console.log(`  Status: ${model.status}`)
      console.log(`  Enabled: ${model.enabled}`)
      console.log(`  Frozen: ${isModelFrozen(model.id)}`)
      console.log(`  Dependencies: ${model.dependencies ? model.dependencies.join(", ") : "None"}`)
    })
  }

  // Function to debug dependency chain between two models
  function debugDependencyChain(modelId: string, targetId: string) {
    const path = []
    let found = false

    const traverse = (currentId: string) => {
      if (currentId === targetId) {
        path.push(currentId)
        found = true
        return true
      }

      const model = getModelById(currentId)
      if (!model || !model.dependencies) return false

      path.push(currentId)
      for (const depId of model.dependencies) {
        if (traverse(depId)) {
          return true
        }
      }
      path.pop()
      return false
    }

    traverse(modelId)

    if (found) {
      console.log(`Dependency chain from ${modelId} to ${targetId}: ${path.join(" -> ")}`)
    } else {
      console.log(`No dependency chain found from ${modelId} to ${targetId}`)
    }

    return { path, found }
  }

  // Function to verify model completion state
  function verifyModelCompletionState() {
    console.log("Verifying model completion state")

    const sequence = getExecutionSequence()
    let allCompleted = true

    sequence.forEach((model) => {
      if (model.enabled && model.status !== "completed" && !isModelFrozen(model.id)) {
        console.log(`Model ${model.id} is not completed or frozen`)
        allCompleted = false
      }
    })

    if (allCompleted) {
      console.log("All enabled models are completed or frozen")
    } else {
      console.log("Not all enabled models are completed or frozen")
    }
  }

  // Add a new function to completely stop all execution checks
  function completeAllExecution() {
    console.log("Forcing complete stop of all execution checks")

    // Set dormant state immediately in the mutable object
    simulationState.dormant = true

    // Remove DOM attributes
    document.documentElement.removeAttribute("data-simulation-running")
    document.documentElement.removeAttribute("data-breakpoint-active")

    // Clear all timeouts and intervals
    if (timeoutsRef.current) {
      timeoutsRef.current.forEach((timeout) => {
        if (typeof timeout === "number") {
          clearTimeout(timeout)
        } else if (typeof timeout === "object") {
          clearInterval(timeout)
        }
      })
      timeoutsRef.current.clear()
    }

    // Reset execution refs
    runningModelsRef.current = new Set()
    runningModulesRef.current = new Set()

    // Update React state
    setSimulationState((prev) => ({
      ...prev,
      running: false,
      paused: false,
      dormant: true,
      runState: "MAIN_COMPLETE" as RunState,
    }))

    return true
  }

  function verifyRunCompletionStatus() {
    // If we're already checking or in dormant state, don't start another check
    if (currentExecutionRef.current.verifying || simulationState.dormant) {
      return false
    }

    console.log("Verifying run completion status")
    currentExecutionRef.current.verifying = true

    try {
      // Get DOM state only once
      const isRunningInDOM = document.documentElement.getAttribute("data-simulation-running") === "true"
      const hasActiveBreakpoint = document.documentElement.getAttribute("data-breakpoint-active") !== null

      if (!isRunningInDOM && !simulationState.running) {
        console.log("Run is already marked as not running")
        currentExecutionRef.current.verifying = false
        return false
      }

      // If there's an active breakpoint, don't mark the run as complete
      if (hasActiveBreakpoint || currentExecutionRef.current.pausedModels.size > 0) {
        console.log("Run has active breakpoints, not marking as complete")
        currentExecutionRef.current.verifying = false
        return false
      }

      // Use cached sequence to avoid triggering rebuilds
      const sequence =
        executionSequenceCache.current.length > 0 ? executionSequenceCache.current : getExecutionSequence()

      if (sequence.length === 0) {
        console.log("No models in execution sequence")
        currentExecutionRef.current.verifying = false
        return false
      }

      // Count models that are completed, frozen, or disabled
      const completedCount = sequence.filter(
        (model) =>
          model.status === "completed" || isModelFrozen(model.id) || !model.enabled || model.status === "disabled",
      ).length

      // Count models that should be running
      const runningCount = sequence.filter(
        (model) => model.status === "running" && model.enabled && !isModelFrozen(model.id),
      ).length

      // Count models that are blocked/pending
      const pendingCount = sequence.filter(
        (model) => model.status === "blocked" || (model.status === "idle" && model.enabled && !isModelFrozen(model.id)),
      ).length

      console.log(
        `Run completion check: ${completedCount}/${sequence.length} models completed/disabled/frozen, ` +
          `${runningCount} running, ${pendingCount} pending/blocked`,
      )

      const runningModelsArray = Array.from(runningModelsRef.current)
      console.log(`Running models according to ref: ${runningModelsArray.length} (${runningModelsArray.join(", ")})`)

      // IMPORTANT: Only mark the run as complete if ALL models are completed/frozen/disabled
      // AND there are no pending models that are blocked by breakpoints
      if (completedCount === sequence.length && pendingCount === 0) {
        console.log("All models are completed/frozen/disabled, ending simulation")

        // Immediately remove the data attribute
        document.documentElement.removeAttribute("data-simulation-running")

        // Force dormant state immediately
        simulationState.dormant = true

        // Update React state
        setSimulationState((prev) => ({
          ...prev,
          running: false,
          dormant: true,
          runState: "MAIN_COMPLETE" as RunState,
        }))

        // Clear all timeouts and intervals
        if (timeoutsRef.current) {
          timeoutsRef.current.forEach((timeout) => {
            if (typeof timeout === "number") {
              clearTimeout(timeout)
            } else if (typeof timeout === "object") {
              clearInterval(timeout)
            }
          })
          timeoutsRef.current.clear()
        }

        currentExecutionRef.current.verifying = false
        return true
      }

      // If there are no running models but there are pending models,
      // check if we're stuck due to a breakpoint that was removed
      if (runningCount === 0 && pendingCount > 0 && !hasActiveBreakpoint) {
        console.log("No models running but pending models exist - checking if we need to restart execution")

        // Find a pending model that can run and start it
        const pendingModels = sequence.filter(
          (model) =>
            model.status !== "completed" && model.status !== "running" && model.enabled && !isModelFrozen(model.id),
        )

        for (const model of pendingModels) {
          if (canModelRun(model.id)) {
            console.log(`Found pending model ${model.id} that can run, starting it`)
            runModel(model.id)
            break
          }
        }
      }

      currentExecutionRef.current.verifying = false
      return false
    } catch (error) {
      console.error("Error during run completion verification:", error)
      currentExecutionRef.current.verifying = false
      return false
    }
  }

  function checkAndRunFinancialModels() {
    console.log("Checking and running financial models")
    // Add your logic here to check and run financial models
    return true // Or return false based on your logic
  }

  // Add test models on initial render
  useEffect(() => {
    console.log("Initial render effect - adding test models")
    try {
      addTestModels()
    } catch (error) {
      console.error("Error in addTestModels effect:", error)
    }
  }, [])

  // Load state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem("modelState")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        setModelGroups(parsedState)
        executionSequenceDirty.current = true // Mark cache as dirty when loading new state
      } catch (error) {
        console.error("Failed to parse saved model state:", error)
      }
    }

    // Load execution order from localStorage
    const savedOrder = localStorage.getItem("executionOrder")
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder)
        setExecutionOrder(parsedOrder)
      } catch (error) {
        console.error("Failed to parse saved execution order:", error)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("modelState", JSON.stringify(modelGroups))
    executionSequenceDirty.current = true // Mark cache as dirty when model groups change
  }, [modelGroups])

  // Save execution order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("executionOrder", JSON.stringify(executionOrder))
    executionSequenceDirty.current = true // Mark cache as dirty when execution order changes
  }, [executionOrder])

  function resetModelState(modelId: string) {
    console.log(`Resetting state for model ${modelId}`)

    // Remove from all tracking sets
    completedModelsRef.current.delete(modelId)
    processedModelsRef.current.delete(modelId)
    runningModelsRef.current.delete(modelId)
    currentExecutionRef.current.processedModels.delete(modelId)

    // Update model status to idle
    updateModelGroup(modelId, {
      status: "idle",
      progress: 0,
      startTime: null,
      endTime: null,
      executionTime: null,
      blockingDependencyId: null,
      blockingDependencyName: null,
    })

    // Update simulation state
    setSimulationState((prev) => {
      const completedModels = new Set(prev.completedModels)
      completedModels.delete(modelId)
      return { ...prev, completedModels }
    })

    console.log(`Model ${modelId} state reset to idle`)
  }

  function debugModelState(modelId: string) {
    const model = getModelById(modelId)
    if (!model) {
      console.log(`Model ${modelId} not found`)
      return
    }

    console.log(`=== DEBUG MODEL STATE: ${modelId} (${model.name}) ===`)
    console.log(`Model status: ${model.status}`)
    console.log(`In completedModelsRef: ${completedModelsRef.current.has(modelId)}`)
    console.log(`In processedModelsRef: ${processedModelsRef.current.has(modelId)}`)
    console.log(`In currentExecution.processedModels: ${currentExecutionRef.current.processedModels.has(modelId)}`)
    console.log(`In simulationState.completedModels: ${ensureSet(simulationState.completedModels).has(modelId)}`)
    console.log(`Running: ${runningModelsRef.current.has(modelId)}`)
    console.log(`Model enabled: ${model.enabled}`)
    console.log(`Model frozen: ${isModelFrozen(modelId)}`)
    console.log(`Dependencies: ${model.dependencies ? model.dependencies.join(", ") : "None"}`)
    console.log(`=== END DEBUG ===`)
  }

  // New functions for Phase 1

  // Get the current run state
  function getRunState(): RunState {
    return simulationState.runState
  }

  // Transition to the adjustments phase
  function transitionToAdjustmentsPhase() {
    console.log("Transitioning to ADJUSTMENTS phase")

    // Only allow transition from MAIN_COMPLETE state
    if (simulationState.runState !== "MAIN_COMPLETE") {
      console.log(`Cannot transition to ADJUSTMENTS from ${simulationState.runState} state`)
      return
    }

    setSimulationState((prev) => ({
      ...prev,
      runState: "ADJUSTMENTS" as RunState,
      dormant: false, // When adjusting, the run is no longer dormant
    }))
  }

  // Finalize the run
  function finalizeRun() {
    console.log("Finalizing run")

    // Only allow finalization from MAIN_COMPLETE or ADJUSTMENTS states
    if (simulationState.runState !== "MAIN_COMPLETE" && simulationState.runState !== "ADJUSTMENTS") {
      console.log(`Cannot finalize run from ${simulationState.runState} state`)
      return
    }

    // Set the end time if not already set
    if (!simulationState.runEndTime) {
      setSimulationState((prev) => ({
        ...prev,
        runEndTime: Date.now(),
      }))
    }

    // End the simulation with FINALIZED state
    endSimulation()
  }

  // Toggle a model's frozen state
  function toggleModelFrozen(modelId: string) {
    const model = getModelById(modelId)
    if (!model) {
      console.log(`Model ${modelId} not found`)
      return
    }

    // Can only freeze a completed model
    if (!isModelFrozen(modelId) && model.status !== "completed") {
      console.log(`Cannot freeze model ${modelId} because it is not completed`)
      return
    }

    setSimulationState((prev) => {
      const frozenModels = new Set(prev.frozenModels)

      if (frozenModels.has(modelId)) {
        frozenModels.delete(modelId)
        console.log(`Model ${modelId} unfrozen`)
      } else {
        frozenModels.add(modelId)
        console.log(`Model ${modelId} frozen`)
      }

      return {
        ...prev,
        frozenModels,
      }
    })

    // Update the model's UI to reflect frozen state
    updateModelGroup(modelId, {
      frozen: !isModelFrozen(modelId),
    })
  }

  // Check if a model is frozen
  function isModelFrozen(modelId: string): boolean {
    return simulationState.frozenModels.has(modelId)
  }

  // Get all frozen models
  function getFrozenModels(): string[] {
    return Array.from(simulationState.frozenModels)
  }

  // Check if a model can be frozen
  function canModelBeFrozen(modelId: string): boolean {
    const model = getModelById(modelId)
    return model?.status === "completed"
  }

  // Function to check if the run is dormant
  function isDormant() {
    return simulationState.dormant
  }

  function forceDormantState() {
    console.log("Forcing transition to dormant state")

    // AGGRESSIVE CLEANUP - Force remove all DOM state attributes
    document.documentElement.removeAttribute("data-simulation-running")
    document.documentElement.removeAttribute("data-breakpoint-active")

    // Clear all timeouts and intervals
    if (timeoutsRef.current) {
      timeoutsRef.current.forEach((timeout) => {
        if (typeof timeout === "number") {
          clearTimeout(timeout)
        } else if (typeof timeout === "object") {
          clearInterval(timeout)
        }
      })
      timeoutsRef.current.clear()
    }

    // Reset all execution references
    runningModelsRef.current = new Set()
    runningModulesRef.current = new Set()

    // Force dormant state immediately
    simulationState.dormant = true

    // Update the React state
    setSimulationState((prev) => ({
      ...prev,
      running: false,
      paused: false,
      dormant: true,
      runState: "MAIN_COMPLETE" as RunState,
    }))

    return true
  }

  const value: ModelStateContextType = {
    modelGroups,
    updateModelGroup,
    updateModuleInGroup,
    getModelById,
    getModuleById,
    resetOutputs,
    forceCompleteModule,
    forceCompleteAllRunning,
    runModel,
    runModule,
    toggleModelEnabled,
    toggleModuleEnabled,
    toggleBreakpoint,
    toggleModuleBreakpoint,
    getExecutionSequence,
    getParallelExecutionGroups,
    getExecutionOrder,
    updateExecutionOrder,
    updateModuleExecutionOrder,
    addTestModels,
    isSimulationRunning,
    runAllModels,
    pauseExecution,
    resumeExecution,
    isSimulationPaused,
    getCurrentRunningModels,
    getPausedOnModel,
    getFailedModel,
    getModelDependencies,
    getModelDependents,
    continueAfterBreakpoint,
    continueAfterModuleBreakpoint,
    debugModelDependencyStatus,
    debugAllModelsState,
    debugDependencyChain,
    forceCompleteModel,
    getRunId,
    getRunStartTime,
    getRunDuration,
    getIterationCount,
    incrementIterationCount,
    getRunEndTime,
    getRunMetadata,
    getRunHistory,
    getLastCompletedRunId,
    prepareToRunModel,
    checkAndRunFinancialModels,
    verifyModelCompletionState,
    canModelRun,
    completeModel,
    resetModelState,
    debugModelState,
    verifyRunCompletionStatus,
    // New functions for Phase 1
    getRunState,
    transitionToAdjustmentsPhase,
    finalizeRun,
    toggleModelFrozen,
    isModelFrozen,
    getFrozenModels,
    canModelBeFrozen,
    isDormant,
    forceDormantState,
    completeAllExecution,
    simulationState,
  }

  // Effect to monitor for stuck runs
  useEffect(() => {
    if (!simulationState.running || simulationState.dormant) {
      return // Don't monitor if not running or in dormant state
    }

    // Check every 3 seconds if the run is stuck (reduced from 5 seconds)
    const intervalId = setInterval(() => {
      if (runningModelsRef.current.size === 0 && simulationState.running) {
        console.log("Detected possible stuck run - no models running but run state is active")
        verifyRunCompletionStatus()
      }
    }, 3000)

    return () => clearInterval(intervalId)
  }, [simulationState.running, simulationState.dormant])

  return <ModelStateContext.Provider value={value}>{children}</ModelStateContext.Provider>
}
