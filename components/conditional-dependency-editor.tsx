"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export function ConditionalDependencyEditor({ modelGroups = [], selectedModelId = null, onSelectModel = () => {} }) {
  const [localSelectedModelId, setLocalSelectedModelId] = useState(selectedModelId || "")
  const [selectedSourceId, setSelectedSourceId] = useState("")
  const [condition, setCondition] = useState("")
  const [operator, setOperator] = useState(">")
  const [value, setValue] = useState("")
  const [action, setAction] = useState("run")
  const [conditions, setConditions] = useState([])
  const { toast } = useToast()

  // Handle model selection
  const handleModelSelect = (modelId) => {
    setLocalSelectedModelId(modelId)
    if (onSelectModel) {
      onSelectModel(modelId)
    }
  }

  // Handle adding a condition
  const handleAddCondition = () => {
    if (!localSelectedModelId || !selectedSourceId || !condition || !value) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to add a condition.",
        variant: "destructive",
      })
      return
    }

    const newCondition = {
      id: Date.now().toString(),
      sourceId: selectedSourceId,
      condition,
      operator,
      value,
      action,
    }

    setConditions((prev) => [...prev, newCondition])

    // Reset form
    setCondition("")
    setValue("")

    toast({
      title: "Condition added",
      description: "The conditional dependency has been added successfully.",
    })
  }

  // Handle removing a condition
  const handleRemoveCondition = (conditionId) => {
    setConditions((prev) => prev.filter((c) => c.id !== conditionId))

    toast({
      title: "Condition removed",
      description: "The conditional dependency has been removed.",
    })
  }

  // Get the selected model
  const selectedModel = modelGroups.find((m) => m.id === localSelectedModelId)

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="target-model">Target Model</Label>
        <Select value={localSelectedModelId} onValueChange={handleModelSelect}>
          <SelectTrigger id="target-model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {modelGroups.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedModel && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="source-model">Source Model</Label>
                  <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                    <SelectTrigger id="source-model">
                      <SelectValue placeholder="Select source model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelGroups
                        .filter((model) => model.id !== localSelectedModelId)
                        .map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="condition">Output Field</Label>
                    <Input
                      id="condition"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      placeholder="e.g., GDP Growth"
                    />
                  </div>
                  <div>
                    <Label htmlFor="operator">Operator</Label>
                    <Select value={operator} onValueChange={setOperator}>
                      <SelectTrigger id="operator">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">Greater than</SelectItem>
                        <SelectItem value="<">Less than</SelectItem>
                        <SelectItem value=">=">Greater or equal</SelectItem>
                        <SelectItem value="<=">Less or equal</SelectItem>
                        <SelectItem value="==">Equal to</SelectItem>
                        <SelectItem value="!=">Not equal to</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="action">Action</Label>
                    <Select value={action} onValueChange={setAction}>
                      <SelectTrigger id="action">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="run">Run</SelectItem>
                        <SelectItem value="skip">Skip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAddCondition}>Add Condition</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Current Conditions for {selectedModel.name}</h3>
            {conditions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No conditions defined yet</div>
            ) : (
              <div className="space-y-2">
                {conditions.map((cond) => {
                  const sourceModel = modelGroups.find((m) => m.id === cond.sourceId)
                  return (
                    <div key={cond.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                      <span className="text-sm">
                        If <Badge variant="outline">{sourceModel?.name || cond.sourceId}</Badge>'s{" "}
                        <Badge variant="outline">{cond.condition}</Badge> {cond.operator}{" "}
                        <Badge variant="outline">{cond.value}</Badge> then <Badge>{cond.action}</Badge>
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveCondition(cond.id)}>
                        Remove
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
