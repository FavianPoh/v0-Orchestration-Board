"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import { createContext, useContext } from "react"
import { initialModelGroups } from "@/data/initial-model-groups"

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
  completeModel: (modelId: string) => void
}

const ModelStateContext = createContext<ModelStateContextType | undefined>(undefined)

// Define the execution order based on the screenshot - ensure Scenario Expansion is first
const EXECUTION_ORDER = [
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

  // Get the execution sequence based on the predefined order and dependencies
  function getExecutionSequence() {
    // Use cached sequence if available and not dirty
    if (executionSequenceCache.current.length > 0 && !executionSequenceDirty.current) {
      return executionSequenceCache.current
    }

    // Start with an empty sequence
    const sequence = []

    // Get all enabled models
    const enabledModels = modelGroups.filter((m) => m.enabled)

    // Build dependency map
    const dependencyMap = new Map<string, string[]>()
    enabledModels.forEach((model) => {
      dependencyMap.set(model.id, model.dependencies || [])
    })

    // Store dependency map for later use
    currentExecutionRef.current.dependencyMap = dependencyMap

    // Add models in the predefined order if they exist and are enabled
    EXECUTION_ORDER.forEach((id) => {
      const model = enabledModels.find((m) => m.id === id)
      if (model && !sequence.some((m) => m.id === id)) {
        sequence.push(model)
      }
    })

    // Finally add any remaining enabled models that weren't in the predefined order
    enabledModels.forEach((model) => {
      if (!sequence.some((m) => m.id === model.id)) {
        sequence.push(model)
      }
    })

    // Cache the result
    executionSequenceCache.current = sequence
    executionSequenceDirty.current = false

    return sequence
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
    if (!model) return false

    // If model is not enabled, it can't run
    if (!model.enabled) {
      console.log(`Model ${modelId} is not enabled`)
      return false
    }

    // If model is already running or completed, it can't run again
    if (model.status === "running" || model.status === "completed") {
      console.log(`Model ${modelId} is already ${model.status}`)
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

      const isCompleted =
        isInCompletedModels || isInProcessedModels || isInSimulationState || isInCurrentExecution || isCompletedInModel

      if (!isCompleted) {
        console.log(`Dependency ${depId} for model ${modelId} is not completed`)
      }

      return isCompleted
    })

    if (allDependenciesCompleted) {
      console.log(`All dependencies for model ${modelId} are completed, can run`)
      return true
    } else {
      console.log(`Not all dependencies for model ${modelId} are completed, cannot run`)
      return false
    }
  }

  // Function to prepare a model for running
  function prepareToRunModel(modelId: string) {
    if (!canModelRun(modelId)) {
      console.log(`Cannot run model ${modelId} - dependencies not met or already running`)
      return false
    }

    const model = getModelById(modelId)
    if (!model) return false

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
    console.log("Ending simulation")

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
    }

    // Update simulation state
    setSimulationState((prev) => ({
      ...prev,
      running: false,
      paused: false,
      pausedOnModel: null,
      pausedOnModule: null,
      runId: null,
      runEndTime: endTime,
      lastCompletedRunId: runId,
      completedRuns: [...prev.completedRuns, runRecord],
    }))

    console.log(`Simulation ended. Duration: ${duration}s, Completed: ${completedModelCount}/${totalModelCount} models`)
  }

  // Function to run a model
  function runModel(modelId: string) {
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
    const dependents = getModelDependents(modelId)
    console.log(`Checking dependents for model ${modelId}: ${dependents.join(", ")}`)

    dependents.forEach((depId) => {
      if (canModelRun(depId)) {
        console.log(`Running dependent model ${depId}`)
        runModel(depId)
      } else {
        console.log(`Dependent model ${depId} cannot run yet`)
      }
    })
  }

  // Function to complete a model after running
  function completeModel(modelId: string) {
    const model = getModelById(modelId)
    if (!model) return

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
      return { ...prev, completedModels }
    })

    console.log(`Model ${modelId} completed in ${executionTime}s`)

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
      pauseExecution()
      setSimulationState((prev) => ({
        ...prev,
        pausedOnModel: modelId,
      }))
      currentExecutionRef.current.pausedModels.add(modelId)
    } else {
      // Check and run dependent models
      checkAndRunDependentModels(modelId)
    }

    // Check if all models are completed
    const sequence = getExecutionSequence()
    const allCompleted = sequence.every((m) => m.status === "completed" || !m.enabled || m.status === "disabled")

    if (allCompleted && simulationState.running && !simulationState.paused) {
      console.log("All models completed, ending simulation")
      endSimulation()
    }
  }

  // Function to run a module
  function runModule(modelId: string, moduleId: string) {
    const model = getModelById(modelId)
    if (!model) return

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

    // Resume execution
    resumeExecution()
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
    console.log(`Running all models ${parallel ? "in parallel" : "in sequence"}`)

    // Reset outputs before running
    resetOutputs()

    // Set simulation state to running
    setSimulationState((prev) => ({
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
    }))

    // Clear completed runs
    setSimulationState((prev) => ({
      ...prev,
      completedRuns: [],
      lastCompletedRunId: null,
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

    // Get execution sequence or parallel groups
    const sequence = parallel ? getParallelExecutionGroups() : getExecutionSequence()

    // Store execution details in ref
    currentExecutionRef.current = {
      ...currentExecutionRef.current,
      parallel,
      currentIndex: 0,
      sequence,
      parallelGroups: parallel ? sequence : [],
      breakpointModels: new Set(),
      breakpointModules: new Set(),
      pausedModels: new Set(),
      pausedModules: new Set(),
      processedModels: new Set(),
      processedModules: new Set(),
      dependencyMap: new Map(),
    }

    // Run models based on parallel or sequential execution
    if (parallel) {
      // Run models in parallel groups
      if (sequence.length > 0) {
        sequence[0].forEach((model) => {
          runModel(model.id)
        })
      }
    } else {
      // Run models in sequence
      if (sequence.length > 0) {
        runModel(sequence[0].id)
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

    // Mark execution sequence as dirty
    executionSequenceDirty.current = true
  }

  // Function to reset all outputs
  function resetOutputs() {
    console.log("Resetting all outputs")

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
      if (model.enabled && model.status !== "completed") {
        console.log(`Model ${model.id} is not completed`)
        allCompleted = false
      }
    })

    if (allCompleted) {
      console.log("All enabled models are completed")
    } else {
      console.log("Not all enabled models are completed")
    }
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
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("modelState", JSON.stringify(modelGroups))
    executionSequenceDirty.current = true // Mark cache as dirty when model groups change
  }, [modelGroups])

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
  }

  return <ModelStateContext.Provider value={value}>{children}</ModelStateContext.Provider>
}
