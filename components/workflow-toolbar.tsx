"use client"

import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RefreshCw, Download, Share2, Settings } from "lucide-react"

type WorkflowToolbarProps = {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
}

export function WorkflowToolbar({ onZoomIn, onZoomOut, onZoomReset }: WorkflowToolbarProps) {
  return (
    <div className="flex items-center space-x-1">
      <Button variant="outline" size="icon" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onZoomReset}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Share2 className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
}
