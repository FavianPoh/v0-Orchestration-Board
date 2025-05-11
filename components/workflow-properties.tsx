"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SensitivityControls } from "@/components/sensitivity-controls"

export function WorkflowProperties() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Workflow Properties</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input id="name" defaultValue="Economic Impact Analysis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" defaultValue="Analyze economic impacts of policy changes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" defaultValue="Data Science Team" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" defaultValue="1.2.0" />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="active" defaultChecked />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="pt-2">
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="pt-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Economic Models</h4>
                    <p className="text-sm text-muted-foreground">GDP, Inflation, Employment</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Active</Badge>
                    <div className="flex items-center space-x-2">
                      <Switch id="freeze-1" />
                      <Label htmlFor="freeze-1">Freeze</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Financial Models</h4>
                    <p className="text-sm text-muted-foreground">Interest Rate, Stock Market, Currency</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Active</Badge>
                    <div className="flex items-center space-x-2">
                      <Switch id="freeze-2" defaultChecked />
                      <Label htmlFor="freeze-2">Freeze</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Risk Assessment</h4>
                    <p className="text-sm text-muted-foreground">Market Risk, Credit Risk, Operational Risk</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">Pending</Badge>
                    <div className="flex items-center space-x-2">
                      <Switch id="freeze-3" />
                      <Label htmlFor="freeze-3">Freeze</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Output Reporting</h4>
                    <p className="text-sm text-muted-foreground">Dashboard, PDF Reports, Data Export</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-500">Inactive</Badge>
                    <div className="flex items-center space-x-2">
                      <Switch id="freeze-4" />
                      <Label htmlFor="freeze-4">Freeze</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end mt-4">
            <Button>Apply Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="sensitivity" className="pt-4">
          <SensitivityControls />
        </TabsContent>

        <TabsContent value="execution" className="pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Input id="schedule" defaultValue="Daily at 00:00 UTC" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (minutes)</Label>
                <Input id="timeout" type="number" defaultValue="60" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Execution Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="retry" defaultChecked />
                  <Label htmlFor="retry">Auto-retry on failure</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notify" defaultChecked />
                  <Label htmlFor="notify">Email notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="parallel" />
                  <Label htmlFor="parallel">Parallel execution</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="cache" defaultChecked />
                  <Label htmlFor="cache">Cache results</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Execution History</Label>
              <div className="border rounded-md p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today, 14:30</span>
                    <Badge className="bg-green-500">Success</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Today, 08:15</span>
                    <Badge className="bg-green-500">Success</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Yesterday, 20:45</span>
                    <Badge className="bg-red-500">Failed</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Yesterday, 14:30</span>
                    <Badge className="bg-green-500">Success</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button>Save Execution Settings</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
