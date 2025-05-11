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
  verifyModelCompletionState: () => void
  canModelRun: (modelId: string) => boolean
  completeModel: () => void
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

  // Get the execution sequence based on the predefined order and dependencies
  function getExecutionSequence() {
    // Force rebuild the execution sequence every time to ensure fresh data
    // This prevents stale data from being displayed in the Execution Sequence view
    executionSequenceDirty.current = true

    // Use cached sequence if available and not dirty
    if (executionSequenceCache.current.length > 0 && !executionSequenceDirty.current) {
      return executionSequenceCache.current
    }

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
      // If we've already processed this node, skip it
      if (visited.has(modelId)) return

      // If we're currently processing this node, we have a cycle
      if (temp.has(modelId)) {
        console.warn(`Circular dependency detected involving model ${modelId}`)
        return
      }

      // Mark node as being processed
      temp.add(modelId)

      // Process all dependencies first
      const dependencies = graph.get(modelId) || []

      // Sort dependencies by execution order for deterministic processing
      const sortedDeps = [...dependencies].sort((a, b) => {
        const orderA = orderMap.has(a) ? orderMap.get(a)! : Number.MAX_SAFE_INTEGER
        const orderB = orderMap.has(b) ? orderMap.get(b)! : Number.MAX_SAFE_INTEGER
        return orderA - orderB
      })

      for (const depId of sortedDeps) {
        visit(depId)
      }

      // Mark node as processed
      temp.delete(modelId)
      visited.add(modelId)

      // Add model to result
      const model = modelMap.get(modelId)
      if (model) {
        result.push(model)
      }
    }

    // Process all models in execution order to ensure deterministic results
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

    // Debug the sequence
    console.log("Generated execution sequence:", result.map((m) => m.id).join(", "))

    return result
  }

  // Get parallel execution groups
  function getParallelExecutionGroups() {
    // Use cached groups if available and not dirty
    if (parallelGroupsCache.current.length > 0 && !executionSequenceDirty.current) {
      return parallelGroupsCache.current
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

    // Cache the result
    parallelGroupsCache.current = groups

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
      // Check multiple sources of truth for completion status
      const isInCompletedModels = completedModelsRef.current.has(depId)
      const isInProcessedModels = processedModelsRef.current.has(depId)
      const isInSimulationState = ensureSet(simulationState.completedModels).has(depId)
      const isInCurrentExecution = ensureSet(currentExecutionRef.current.processedModels).has(depId)

      const depModel = getModelById(depId)
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
      }
    })

    console.log(`Simulation ended. Duration: ${duration}s, Completed: ${completedModelCount}/${totalModelCount} models`)
  }

  // Function to run a model
  function runModel(modelId: string) {
    // If model is frozen, it can't run
    if (isModelFrozen(modelId)) {
      console.log(`Model ${modelId} is frozen and cannot run`)
      return
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

  // Function to check and run models that depend on a completed model
  function checkAndRunDependentModels(modelId: string) {
    // At the beginning of the checkAndRunDependentModels function, add:
    // Check if there's an active breakpoint
    const activeBreakpoint = document.documentElement.getAttribute("data-breakpoint-active")
    if (activeBreakpoint) {
      console.log(`Cannot run dependent models: breakpoint active on model ${activeBreakpoint}`)
      return
    }
    // Check if simulation is running using the data attribute
    const isRunning = document.querySelector("[data-simulation-running='true']") !== null

    // If the simulation is no longer running, don't start new models
    if (!isRunning) {
      console.log("Simulation is not running (checked via data attribute), skipping dependent model execution")
      return
    }

    // If simulation is paused, don't start new models
    if (simulationState.paused) {
      console.log("Simulation is paused, skipping dependent model execution")
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

      // Check each model to see if it can run now
      let startedCount = 0
      pendingModels.forEach((model) => {
        if (canModelRun(model.id)) {
          console.log(`Running model ${model.id} in parallel mode`)
          runModel(model.id)
          startedCount++
        } else {
          console.log(`Model ${model.id} cannot run yet in parallel mode`)
        }
      })

      console.log(`Started ${startedCount} new models in parallel mode`)

      // If no models were started but we have pending models, check if we're stuck
      if (startedCount === 0 && pendingModels.length > 0) {
        console.log("No new models started in parallel mode, checking for issues...")
        pendingModels.forEach((model) => {
          debugModelDependencyStatus(model.id)
        })
      }
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
          return // Only run one model at a time in sequential mode
        } else {
          console.log(`Next model ${nextModel.id} cannot run yet, dependencies not met`)
          debugModelDependencyStatus(nextModel.id)
        }
      }

      console.log("No more models can run in the sequence")
    }
  }

  // Function to complete a model after running
  function completeModel(modelId: string) {
    const model = getModelById(modelId)
    if (!model) {
      console.log(`Cannot complete model ${modelId}: model not found`)
      return
    }

    console.log(`Completing model ${modelId}`)

    const endTime = Date.now()
    const executionTime = model.startTime ? (endTime - model.startTime) / 1000 : null

    // Update model status to completed
    updateModelGroup(modelId, {
      status: "completed",
      progress: 100,
      endTime,
      executionTime,
    })

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
      // IMPORTANT: Preserve the running state - don't modify it here
      return { ...prev, completedModels }
    })

    console.log(`Model ${modelId} completed in ${executionTime}s`)
    console.log(`Simulation running state: ${simulationState.running}`)

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

      // Pause the entire simulation
      pauseExecution()

      // Mark which model caused the pause
      setSimulationState((prev) => ({
        ...prev,
        pausedOnModel: modelId,
      }))

      // Add to paused models set
      currentExecutionRef.current.pausedModels.add(modelId)

      // IMPORTANT: Set a data attribute to indicate a breakpoint is active
      document.documentElement.setAttribute("data-breakpoint-active", modelId)

      console.log(`Execution paused at breakpoint on model ${modelId}`)
      return // Don't continue execution after a breakpoint
    }

    // IMPORTANT: We need to force a check of the current simulation state
    // Get the current simulation state directly instead of using the stale closure value
    const isRunning = document.querySelector("[data-simulation-running='true']") !== null
    console.log(`Force checked simulation running state: ${isRunning}`)

    // Only check and run dependent models if the simulation is still running and not paused
    if (isRunning) {
      console.log(`Checking for models that can run after completion of ${modelId}`)
      // Use setTimeout to ensure this runs after state updates are processed
      setTimeout(() => checkAndRunDependentModels(modelId), 0)
    } else {
      console.log(`Simulation is not running, not checking for next models`)
    }

    // Check if all models are completed - do this check regardless of the isRunning state
    // to ensure we don't miss completion detection
    const sequence = getExecutionSequence()

    // Count models that are either completed or frozen
    const completedOrFrozenCount = sequence.filter(
      (m) => m.status === "completed" || isModelFrozen(m.id) || !m.enabled || m.status === "disabled",
    ).length

    const allCompleted = completedOrFrozenCount === sequence.length

    // Force check the simulation state directly from the DOM attribute
    const isRunningFromDOM = document.documentElement.getAttribute("data-simulation-running") === "true"

    // Log detailed completion status for debugging
    console.log(`Completion check: All completed or frozen: ${allCompleted}, Running state: ${isRunningFromDOM}`)
    console.log(`Completed/frozen models: ${completedOrFrozenCount}/${sequence.length}`)

    if (allCompleted && (isRunningFromDOM || simulationState.running)) {
      console.log("All models completed or frozen, transitioning to MAIN_COMPLETE state")

      // Update both runState and running flag to ensure UI updates correctly
      setSimulationState((prev) => ({
        ...prev,
        runState: "MAIN_COMPLETE" as RunState,
        running: false, // Explicitly set running to false
      }))

      // Also remove the data-simulation-running attribute to ensure consistency
      document.documentElement.removeAttribute("data-simulation-running")

      console.log("Simulation running state set to false")
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
      paused: false,
      pausedOnModel: null,
    }))

    // Resume execution by checking for dependent models
    setTimeout(() => {
      checkAndRunDependentModels(modelId)
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

    // Force rebuild the execution sequence
    executionSequenceDirty.current = true

    // Get execution sequence or parallel groups
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
      }
    })

    // Reset execution refs
    runningModelsRef.current = new Set()
    runningModulesRef.current = new Set()
    completedModelsRef.current = new Set()
    processedModelsRef.current = new Set()

    // Store execution details in ref
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
    // Check if test models already exist
    const testModelExists = modelGroups.some((model) => model.id.startsWith("test-model-"))
    if (testModelExists) {
      console.log("Test models already exist")
      return
    }

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
    setModelGroups((prevGroups) => [...testModels, ...prevGroups])
    console.log("Added test models")

    // Update execution order to include test models
    setExecutionOrder((prevOrder) => {
      const newOrder = [...prevOrder]
      // Add test models to the beginning if they don't exist
      testModels.forEach((model) => {
        if (!newOrder.includes(model.id)) {
          newOrder.unshift(model.id)
        }
      })
      return newOrder
    })

    // Mark execution sequence as dirty
    executionSequenceDirty.current = true
  }

  // Function to reset all outputs
  function resetOutputs() {
    console.log("Resetting all outputs")

    // Remove the data attribute when resetting
    document.documentElement.removeAttribute("data-simulation-running")
    // Clear any breakpoint state
    document.documentElement.removeAttribute("data-breakpoint-active")

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

    // Reset all models to idle state
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

        // Reset module statuses if they exist
        if (model.modules) {
          updatedModel.modules = model.modules.map((module) => ({
            ...module,
            status: "idle",
          }))
        }

        return updatedModel
      }),
    )

    // Reset simulation state
    setSimulationState((prev) => ({
      ...prev,
      running: false,
      paused: false,
      pausedOnModel: null,
      pausedOnModule: null,
      failedModel: null,
      completedModels: new Set(),
      runState: "IDLE" as RunState,
      frozenModels: new Set<string>(), // Clear frozen models on reset
    }))

    // Reset execution refs
    runningModelsRef.current = new Set()
    runningModulesRef.current = new Set()
    completedModelsRef.current = new Set()
    processedModelsRef.current = new Set()
    currentExecutionRef.current.processedModels = new Set()
    currentExecutionRef.current.processedModules = new Set()
    currentExecutionRef.current.pausedModels = new Set()
    currentExecutionRef.current.pausedModules = new Set()

    console.log("All outputs reset")
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

    updateModelGroup(modelId, { breakpoint: !model.breakpoint })
    console.log(`Breakpoint ${model.breakpoint ? "removed from" : "set on"} model ${modelId}`)

    // Update breakpoint models set
    const breakpointModels = new Set(currentExecutionRef.current.breakpointModels)
    if (model.breakpoint) {
      breakpointModels.delete(modelId)
    } else {
      breakpointModels.add(modelId)
    }
    currentExecutionRef.current.breakpointModels = breakpointModels
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

  // Function to verify if a run should be completed
  function verifyRunCompletionStatus() {
    // Only check if simulation is running
    if (!simulationState.running) {
      return false
    }

    console.log("Verifying run completion status")

    // Get the execution sequence
    const sequence = getExecutionSequence()

    // Check if all models are completed or frozen = getExecutionSequence()

    // Check if all models are completed or frozen
    const allCompleted = sequence.every(
      (m) => m.status === "completed" || !m.enabled || m.status === "disabled" || isModelFrozen(m.id),
    )

    console.log(
      `Run completion check: All completed or frozen: ${allCompleted}, Models: ${completedModelsRef.current.size}/${sequence.length}`,
    )

    if (allCompleted) {
      console.log("All models are completed or frozen, transitioning to MAIN_COMPLETE state")

      // Instead of ending the simulation, transition to MAIN_COMPLETE state
      setSimulationState((prev) => ({
        ...prev,
        runState: "MAIN_COMPLETE" as RunState,
      }))
      return true
    }

    return false
  }

  function checkAndRunFinancialModels() {
    console.log("Checking and running financial models")
    // Add your logic here to check and run financial models
    return true // Or return false based on your logic
  }

  // Add test models on initial render
  useEffect(() => {
    addTestModels()
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
  }

  return <ModelStateContext.Provider value={value}>{children}</ModelStateContext.Provider>
}
