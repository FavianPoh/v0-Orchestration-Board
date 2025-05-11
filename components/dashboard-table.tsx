import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const recentRuns = [
  {
    id: "WF-1234",
    name: "Economic Impact Analysis",
    startTime: "2023-05-09 14:30:25",
    duration: "3m 12s",
    status: "success",
    modules: 4,
  },
  {
    id: "WF-1233",
    name: "Financial Forecast",
    startTime: "2023-05-09 12:15:10",
    duration: "2m 45s",
    status: "success",
    modules: 3,
  },
  {
    id: "WF-1232",
    name: "Risk Assessment Pipeline",
    startTime: "2023-05-09 10:05:33",
    duration: "4m 20s",
    status: "failed",
    modules: 5,
  },
  {
    id: "WF-1231",
    name: "Market Analysis",
    startTime: "2023-05-08 18:22:15",
    duration: "1m 55s",
    status: "success",
    modules: 2,
  },
  {
    id: "WF-1230",
    name: "Quarterly Reporting",
    startTime: "2023-05-08 15:10:05",
    duration: "5m 30s",
    status: "pending",
    modules: 6,
  },
]

export function DashboardTable() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Workflow</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Modules</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentRuns.map((run) => (
          <TableRow key={run.id}>
            <TableCell className="font-medium">{run.id}</TableCell>
            <TableCell>{run.name}</TableCell>
            <TableCell>{run.startTime}</TableCell>
            <TableCell>{run.duration}</TableCell>
            <TableCell>{run.modules}</TableCell>
            <TableCell>{getStatusBadge(run.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
