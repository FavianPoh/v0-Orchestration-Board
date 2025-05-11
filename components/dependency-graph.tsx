"use client"

import { useCallback, useState } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModuleGroupNode } from "./nodes/module-group-node"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Node types
const nodeTypes = {
  moduleGroup: ModuleGroupNode,
}

export function DependencyGraph({ modelGroups = [], dependencyConfig = {}, onUpdateDependencyConfig, className = "" }) {
  const router = useRouter()
  const { toast } = useToast()

  // Initial nodes - more spaced out and linear layout
  const initialNodes = [
    {
      id: "economic-models",
      type: "moduleGroup",
      position: { x: 50, y: 100 },
      data: {
        id: "economic-models",
        label: "Economic Models",
        status: "completed",
        frozen: false,
        progress: 100,
        type: "input",
        modules: [
          { id: "gdp-model", name: "GDP Model" },
          { id: "inflation-model", name: "Inflation Model" },
          { id: "unemployment-model", name: "Unemployment Model" },
          { id: "productivity-model", name: "Productivity Model", optional: true, enabled: false },
        ],
        outputs: [
          { name: "GDP Growth", value: "2.3", unit: "%" },
          { name: "Inflation", value: "3.1", unit: "%" },
          { name: "Unemployment", value: "4.5", unit: "%" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
      },
    },
    {
      id: "scenario-expansion",
      type: "moduleGroup",
      position: { x: 350, y: 100 },
      data: {
        id: "scenario-expansion",
        label: "Scenario Expansion",
        status: "completed",
        frozen: false,
        breakpoint: false,
        progress: 100,
        modules: [
          { id: "scenario-generator", name: "Scenario Generator" },
          { id: "path-expansion", name: "Path Expansion" },
          { id: "coherence-check", name: "Coherence Check" },
        ],
        outputs: [
          { name: "Scenarios", value: "12", unit: "" },
          { name: "Confidence", value: "95", unit: "%" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
      },
    },
    {
      id: "market-models",
      type: "moduleGroup",
      position: { x: 650, y: 50 },
      data: {
        id: "market-models",
        label: "Market Models",
        status: "completed",
        frozen: false,
        breakpoint: false,
        progress: 100,
        modules: [
          { id: "equity-model", name: "Equity Model" },
          { id: "price-elasticity", name: "Price Elasticity" },
          { id: "diffusion-model", name: "Diffusion Model" },
          { id: "market-sentiment", name: "Market Sentiment", optional: true, enabled: false },
        ],
        outputs: [
          { name: "Equity Return", value: "7.2", unit: "%" },
          { name: "Bond Yield", value: "3.8", unit: "%" },
          { name: "FX Volatility", value: "12.5", unit: "%" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
      },
    },
    {
      id: "balance-sheet-models",
      type: "moduleGroup",
      position: { x: 650, y: 250 },
      data: {
        id: "balance-sheet-models",
        label: "Balance Sheet Models",
        status: "completed",
        frozen: false,
        breakpoint: false,
        progress: 100,
        modules: [
          { id: "asset-projection", name: "Asset Projection" },
          { id: "liability-projection", name: "Liability Projection" },
          { id: "equity-calculation", name: "Equity Calculation" },
          { id: "liquidity-analysis", name: "Liquidity Analysis", optional: true, enabled: false },
        ],
        outputs: [
          { name: "Assets", value: "1.2", unit: "B" },
          { name: "Liabilities", value: "0.9", unit: "B" },
          { name: "Equity", value: "0.3", unit: "B" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
      },
    },
    {
      id: "risk-models",
      type: "moduleGroup",
      position: { x: 950, y: 150 },
      data: {
        id: "risk-models",
        label: "Risk Models",
        status: "completed",
        frozen: false,
        breakpoint: false,
        progress: 100,
        modules: [
          { id: "market-risk", name: "Market Risk" },
          { id: "credit-risk", name: "Credit Risk" },
          { id: "operational-risk", name: "Operational Risk" },
          { id: "var-calculator", name: "VaR Calculator" },
        ],
        outputs: [
          { name: "VaR", value: "42", unit: "M" },
          { name: "Expected Loss", value: "15", unit: "M" },
          { name: "Op Risk", value: "8", unit: "M" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
      },
    },
    {
      id: "credit-review",
      type: "moduleGroup",
      position: { x: 950, y: 300 },
      data: {
        id: "credit-review",
        label: "Credit Review",
        status: "idle",
        frozen: false,
        breakpoint: false,
        progress: 0,
        optional: true,
        enabled: false,
        modules: [
          { id: "pd-adjustment", name: "PD Adjustment" },
          { id: "lgd-calibration", name: "LGD Calibration" },
          { id: "rating-override", name: "Rating Override" },
          { id: "exposure-adjustment", name: "Exposure Adjustment" },
        ],
        outputs: [
          { name: "Adjusted PD", value: "—", unit: "%" },
          { name: "RWA Impact", value: "—", unit: "%" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
        onToggleEnabled: (id) => handleToggleNode(id),
      },
    },
    {
      id: "stress-testing",
      type: "moduleGroup",
      position: { x: 1250, y: 300 },
      data: {
        id: "stress-testing",
        label: "Stress Testing",
        status: "idle",
        frozen: false,
        breakpoint: false,
        progress: 0,
        optional: true,
        enabled: false,
        modules: [
          { id: "scenario-definition", name: "Scenario Definition" },
          { id: "impact-assessment", name: "Impact Assessment" },
          { id: "capital-adequacy", name: "Capital Adequacy" },
          { id: "recovery-analysis", name: "Recovery Analysis" },
        ],
        outputs: [
          { name: "Capital Impact", value: "—", unit: "USD" },
          { name: "Liquidity Impact", value: "—", unit: "USD" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
        onToggleEnabled: (id) => handleToggleNode(id),
      },
    },
    {
      id: "capital-models",
      type: "moduleGroup",
      position: { x: 1250, y: 150 },
      data: {
        id: "capital-models",
        label: "Capital Models",
        status: "completed",
        frozen: false,
        breakpoint: false,
        progress: 100,
        modules: [
          { id: "economic-capital", name: "Economic Capital" },
          { id: "regulatory-capital", name: "Regulatory Capital" },
          { id: "capital-optimization", name: "Capital Optimization" },
        ],
        outputs: [
          { name: "Econ Capital", value: "85", unit: "M" },
          { name: "Reg Capital", value: "92", unit: "M" },
          { name: "CET1 Ratio", value: "12.3", unit: "%" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
      },
    },
    {
      id: "financial-models",
      type: "moduleGroup",
      position: { x: 1550, y: 150 },
      data: {
        id: "financial-models",
        label: "Financial Models",
        status: "idle",
        frozen: false,
        breakpoint: false,
        progress: 0,
        type: "output",
        modules: [
          { id: "income-statement", name: "Income Statement" },
          { id: "balance-sheet", name: "Balance Sheet" },
          { id: "cash-flow", name: "Cash Flow" },
        ],
        outputs: [
          { name: "Net Income", value: "?", unit: "M" },
          { name: "ROE", value: "?", unit: "%" },
          { name: "EPS", value: "?", unit: "$" },
        ],
        onModuleClick: (moduleId) => router.push(`/module-details/${moduleId}`),
      },
    },
  ]

  // Initial edges - showing proper connections including Scenario Expansion
  const initialEdges = [
    {
      id: "economic-to-scenario",
      source: "economic-models",
      target: "scenario-expansion",
      animated: true,
      style: { stroke: "#10b981" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "scenario-to-market",
      source: "scenario-expansion",
      target: "market-models",
      animated: true,
      style: { stroke: "#10b981" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "scenario-to-balance",
      source: "scenario-expansion",
      target: "balance-sheet-models",
      animated: true,
      style: { stroke: "#10b981" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "market-to-risk",
      source: "market-models",
      target: "risk-models",
      animated: true,
      style: { stroke: "#10b981" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "balance-to-risk",
      source: "balance-sheet-models",
      target: "risk-models",
      animated: true,
      style: { stroke: "#10b981" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "risk-to-credit-review",
      source: "risk-models",
      target: "credit-review",
      animated: true,
      style: { stroke: "#10b981", strokeDasharray: "5,5" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "credit-review-to-capital",
      source: "credit-review",
      target: "capital-models",
      animated: true,
      style: { stroke: "#10b981", strokeDasharray: "5,5" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "risk-to-stress-testing",
      source: "risk-models",
      target: "stress-testing",
      animated: true,
      style: { stroke: "#10b981", strokeDasharray: "5,5" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "stress-testing-to-capital",
      source: "stress-testing",
      target: "capital-models",
      animated: true,
      style: { stroke: "#10b981", strokeDasharray: "5,5" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "risk-to-capital",
      source: "risk-models",
      target: "capital-models",
      animated: true,
      style: { stroke: "#10b981" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
    {
      id: "capital-to-financial",
      source: "capital-models",
      target: "financial-models",
      animated: true,
      style: { stroke: "#10b981" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#10b981",
      },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [viewType, setViewType] = useState("all")

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges])

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  // Handle priority change
  const handlePriorityChange = useCallback(
    (value) => {
      if (!selectedNode || !onUpdateDependencyConfig) return

      const newConfig = { ...dependencyConfig }
      if (!newConfig[selectedNode.id]) {
        newConfig[selectedNode.id] = {
          dependencies: [],
          estimatedDuration: 5,
          parallelizable: false,
        }
      }

      newConfig[selectedNode.id].priority = value[0]
      onUpdateDependencyConfig(newConfig)
    },
    [selectedNode, dependencyConfig, onUpdateDependencyConfig],
  )

  const handleNodeClick = (nodeId) => {
    // First handle the selection for the current view
    onNodeSelect(nodeId)

    // If it's a module node, navigate to module details
    if (nodeId.startsWith("module-")) {
      const moduleId = nodeId.replace("module-", "")
      router.push(`/module-details/${moduleId}`)
    }
    // If it's a model group node, navigate to model group details
    else if (nodeId.startsWith("group-")) {
      const groupId = nodeId.replace("group-", "")
      router.push(`/model-groups/${groupId}`)
    }
  }

  const onNodeSelect = useCallback(
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      setSelectedNode(node)
    },
    [nodes, setSelectedNode],
  )

  // Toggle node enabled state
  const handleToggleNode = (nodeId) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const newEnabled = !node.data.enabled

          // Show toast notification
          toast({
            title: `${node.data.label} ${newEnabled ? "enabled" : "disabled"}`,
            description: `The model has been ${newEnabled ? "added to" : "removed from"} the dependency graph.`,
          })

          return {
            ...node,
            data: {
              ...node.data,
              enabled: newEnabled,
              status: newEnabled ? "idle" : "disabled",
            },
          }
        }
        return node
      }),
    )
  }

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: "600px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        nodeTypes={nodeTypes}
        fitView
        style={{ width: "100%", height: "100%" }}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />

        <Panel position="top-right">
          <Card className="w-64">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Module Dependencies</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Tabs defaultValue="all" value={viewType} onValueChange={setViewType}>
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="direct" className="flex-1">
                        Direct
                      </TabsTrigger>
                      <TabsTrigger value="conditional" className="flex-1">
                        Conditional
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {selectedNode && (
                  <div className="pt-2 border-t">
                    <h3 className="font-medium text-sm mb-2">
                      Selected: <Badge>{selectedNode.data.label}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {selectedNode.data.optional && (
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Enabled</Label>
                          <div className="flex items-center">
                            <Label className="text-xs mr-2">{selectedNode.data.enabled ? "Yes" : "No"}</Label>
                            <div
                              className="relative inline-flex h-4 w-8 items-center rounded-full bg-muted transition-colors cursor-pointer"
                              onClick={() => handleToggleNode(selectedNode.id)}
                            >
                              <span
                                className={`absolute mx-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                                  selectedNode.data.enabled ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Module Priority</Label>
                        <Slider
                          defaultValue={[dependencyConfig[selectedNode.id]?.priority || 0]}
                          max={5}
                          step={1}
                          onValueChange={handlePriorityChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Panel>
        <Panel position="bottom-left">
          <Card className="w-64">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Legend</div>
                <div className="flex items-center">
                  <div className="w-8 h-0 border-t-2 border-green-500 mr-2"></div>
                  <span className="text-xs">Standard Dependency</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-0 border-t-2 border-green-500 border-dashed mr-2"></div>
                  <span className="text-xs">Optional Dependency</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Optional
                  </Badge>
                  <span className="text-xs">Optional Module</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  )
}
