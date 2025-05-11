"use client"

import { memo } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"

function ModuleGroupNodeComponent({ data, isConnectable }) {
  // Status colors
  const statusColors = {
    completed: "bg-green-500",
    running: "bg-blue-500",
    paused: "bg-yellow-500",
    idle: "bg-gray-400",
    error: "bg-red-500",
    disabled: "bg-gray-300",
  }

  const handleModuleClick = (moduleId, e) => {
    e.stopPropagation()
    if (data.onModuleClick) {
      data.onModuleClick(moduleId)
    }
  }

  const toggleEnabled = (e) => {
    e.stopPropagation()
    if (data.onToggleEnabled) {
      data.onToggleEnabled(data.id)
    }
  }

  // Determine if the node should be dimmed (optional and disabled)
  const isDisabled = data.optional && !data.enabled

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Card className={`w-64 shadow-md ${isDisabled ? "opacity-60" : ""}`}>
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm flex items-center">
              {data.label}
              {data.breakpoint && <Badge className="ml-2 bg-red-500">Breakpoint</Badge>}
              {data.priority > 3 && <Badge className="ml-2">High Priority</Badge>}
              {data.optional && (
                <Badge variant="outline" className="ml-2">
                  Optional
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center">
              {data.optional && (
                <Switch checked={data.enabled} onCheckedChange={toggleEnabled} size="sm" className="scale-75 mr-1" />
              )}
              <div className={`w-2 h-2 rounded-full ${statusColors[data.status] || "bg-gray-400"}`}></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {data.progress > 0 && data.progress < 100 && (
            <div className="mb-2">
              <Progress value={data.progress} className="h-1" />
            </div>
          )}

          <div className="text-xs space-y-1">
            {data.modules && data.modules.length > 0 && (
              <div>
                <div className="font-medium mb-1">Modules:</div>
                <div className="grid grid-cols-1 gap-1">
                  {data.modules.slice(0, 3).map((module) => (
                    <div
                      key={module.id}
                      className="flex justify-between cursor-pointer hover:bg-muted p-1 rounded"
                      onClick={(e) => handleModuleClick(module.id, e)}
                    >
                      <span>{module.name}</span>
                      {module.optional && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          Optional
                        </Badge>
                      )}
                    </div>
                  ))}
                  {data.modules.length > 3 && (
                    <div className="text-muted-foreground">+{data.modules.length - 3} more</div>
                  )}
                </div>
              </div>
            )}

            {data.outputs && data.outputs.length > 0 && (
              <div className="mt-2">
                <div className="font-medium mb-1">Outputs:</div>
                <div className="grid grid-cols-1 gap-1">
                  {data.outputs.map((output, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">{output.name}:</span>
                      <span>
                        {output.value} {output.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  )
}

// Export a memoized version to improve performance
export const ModuleGroupNode = memo(ModuleGroupNodeComponent)
