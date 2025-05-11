import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardMetrics } from "@/components/dashboard-metrics"
import { DashboardCharts } from "@/components/dashboard-charts"
import { DashboardTable } from "@/components/dashboard-table"

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of workflow results and module performance</p>
        </div>
      </div>

      <DashboardMetrics />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="economic">Economic Models</TabsTrigger>
          <TabsTrigger value="financial">Financial Models</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
                <CardDescription>Execution time and success rate across all workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardCharts type="performance" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Module Execution</CardTitle>
                <CardDescription>Execution count and status by module group</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardCharts type="modules" />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Workflow Runs</CardTitle>
              <CardDescription>Latest workflow executions and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Economic Models</CardTitle>
              <CardDescription>Performance and results of economic model modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Economic models dashboard content
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Models</CardTitle>
              <CardDescription>Performance and results of financial model modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Financial models dashboard content
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Performance and results of risk assessment modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Risk assessment dashboard content
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
