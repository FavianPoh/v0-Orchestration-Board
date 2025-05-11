"use client"

import { useState } from "react"
import { useModelState } from "@/context/model-state-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, FileCheck, User, Clock } from "lucide-react"

export function RunSignoff() {
  const { toast } = useToast()
  const {
    getRunId,
    getLastCompletedRunId,
    getRunMetadata,
    getRunDuration,
    getRunStartTime,
    getRunEndTime,
    getIterationCount,
    getExecutionSequence,
  } = useModelState()

  const [comments, setComments] = useState("")
  const [signoffChecks, setSignoffChecks] = useState({
    resultsReviewed: false,
    outputsValidated: false,
    documentationComplete: false,
    approvalGranted: false,
  })

  const runId = getRunId() || getLastCompletedRunId()
  const sequence = getExecutionSequence()
  const completedModels = sequence.filter((model) => model.status === "completed")
  const failedModels = sequence.filter((model) => model.status === "failed")
  const totalModels = sequence.length

  const handleCheckChange = (key) => {
    setSignoffChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSignoff = () => {
    // In a real app, this would call an API to record the signoff
    toast({
      title: "Run signed off successfully",
      description: `Run #${runId} has been signed off by the current user.`,
    })
  }

  const allChecksComplete = Object.values(signoffChecks).every(Boolean)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Run Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Run ID:</span>
              <Badge variant="outline" className="font-mono">
                {runId || "No completed run"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <Badge className="bg-green-100 text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" /> Completed
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Duration:</span>
              <span>{getRunDuration()}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Completed At:</span>
              <span>{getRunEndTime() ? new Date(getRunEndTime()).toLocaleString() : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Iteration:</span>
              <span>{getIterationCount() + 1}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Run Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-md border border-green-200 text-center">
                <div className="text-lg font-bold text-green-600">{completedModels.length}</div>
                <div className="text-xs text-green-700">Completed Models</div>
              </div>
              <div className="bg-red-50 p-3 rounded-md border border-red-200 text-center">
                <div className="text-lg font-bold text-red-600">{failedModels.length}</div>
                <div className="text-xs text-red-700">Failed Models</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-center">
                <div className="text-lg font-bold text-blue-600">{totalModels}</div>
                <div className="text-xs text-blue-700">Total Models</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-center">
                <div className="text-lg font-bold text-amber-600">
                  {Math.round((completedModels.length / totalModels) * 100)}%
                </div>
                <div className="text-xs text-amber-700">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileCheck className="mr-2 h-5 w-5" />
            Sign-off Checklist
          </CardTitle>
          <CardDescription>
            Please review and confirm the following items before signing off on this run
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="resultsReviewed"
                checked={signoffChecks.resultsReviewed}
                onCheckedChange={() => handleCheckChange("resultsReviewed")}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="resultsReviewed" className="font-medium">
                  Results Reviewed
                </Label>
                <p className="text-sm text-muted-foreground">I have reviewed all model outputs and results</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="outputsValidated"
                checked={signoffChecks.outputsValidated}
                onCheckedChange={() => handleCheckChange("outputsValidated")}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="outputsValidated" className="font-medium">
                  Outputs Validated
                </Label>
                <p className="text-sm text-muted-foreground">
                  I have validated that all outputs are correct and reasonable
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="documentationComplete"
                checked={signoffChecks.documentationComplete}
                onCheckedChange={() => handleCheckChange("documentationComplete")}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="documentationComplete" className="font-medium">
                  Documentation Complete
                </Label>
                <p className="text-sm text-muted-foreground">All necessary documentation has been completed</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="approvalGranted"
                checked={signoffChecks.approvalGranted}
                onCheckedChange={() => handleCheckChange("approvalGranted")}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="approvalGranted" className="font-medium">
                  Approval Granted
                </Label>
                <p className="text-sm text-muted-foreground">I grant my approval for this run to be finalized</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments or notes about this run..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>
              {getRunEndTime()
                ? `Completed ${new Date(getRunEndTime()).toLocaleDateString()}`
                : "Run not yet completed"}
            </span>
          </div>
          <Button
            onClick={handleSignoff}
            disabled={!allChecksComplete || !runId}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Sign Off Run
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sign-off History</CardTitle>
          <CardDescription>Previous sign-offs for this run</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Comments</th>
                </tr>
              </thead>
              <tbody>
                {/* This would be populated from an API in a real app */}
                <tr className="border-t">
                  <td className="p-2">{new Date().toLocaleDateString()}</td>
                  <td className="p-2 flex items-center">
                    <User className="w-3 h-3 mr-1" /> John Doe
                  </td>
                  <td className="p-2">
                    <Badge className="bg-amber-100 text-amber-600">Pending</Badge>
                  </td>
                  <td className="p-2 max-w-[300px] truncate">Initial review completed, waiting for final approval</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
